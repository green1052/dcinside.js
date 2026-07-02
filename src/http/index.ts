import ky, {type KyInstance, type Options} from "ky";
import {API_URL} from "./constants";
import {HTTPError} from "./errors";
import {defaultHeaders} from "./utils";

/** Bun fetch의 proxy 옵션. ky 옵션에는 없지만 런타임에 fetch로 전달됨. */
export interface ProxyOptions {
    proxy?: string;
}

export interface DCInsideRequestContext {
    getAppId: () => Promise<string>;
    getClientToken: () => string | null;
    ensureClientToken: () => Promise<string>;
    getUserId: () => string | null;
}

export type MultipartValue = string | number | boolean | Blob | File | null | undefined;
export type MultipartFields = Record<string, MultipartValue>;

export class KyHttpClient {
    readonly ky: KyInstance;
    private context: DCInsideRequestContext | null = null;

    constructor(options: Options & ProxyOptions = {}) {
        const {proxy, ...kyOptions} = options;
        this.ky = ky.create({
            retry: 0,
            timeout: 30_000,
            throwHttpErrors: false,
            ...kyOptions,
            ...(proxy ? {proxy} : {}),
            headers: {
                ...defaultHeaders(),
                ...kyOptions.headers
            },
            hooks: {
                ...kyOptions.hooks,
                beforeRequest: [
                    ({request}) => this.injectDCInsideContext(request),
                    redirectAppApiGet,
                    ...(kyOptions.hooks?.beforeRequest ?? [])
                ],
                afterResponse: [
                    ({response}) => {
                        if (!response.ok) {
                            throw new HTTPError(
                                `HTTP Error: ${response.status} ${response.statusText}`.trim(),
                                response.status,
                                response
                            );
                        }
                    },
                    ...(kyOptions.hooks?.afterResponse ?? [])
                ]
            }
        });
    }

    useDCInsideContext(context: DCInsideRequestContext): void {
        this.context = context;
    }

    private async injectDCInsideContext(request: Request): Promise<Request | void> {
        if (!this.context || !shouldInjectDCInsideContext(request.url)) return;

        if (request.method === "GET") return this.injectGetContext(request);
        if (request.method === "POST") return this.injectPostContext(request);
    }

    private async injectGetContext(request: Request): Promise<Request> {
        const appId = await this.context!.getAppId();
        const userId = this.context!.getUserId();

        const url = new URL(request.url);
        if (!url.searchParams.has("app_id")) url.searchParams.set("app_id", appId);
        if (userId && !url.searchParams.has("confirm_id")) url.searchParams.set("confirm_id", userId);

        return new Request(url.toString(), request);
    }

    private async injectPostContext(request: Request): Promise<Request> {
        const appId = await this.context!.getAppId();
        const userId = this.context!.getUserId();
        let clientToken = this.context!.getClientToken();
        if (!clientToken) {
            try {
                clientToken = await this.context!.ensureClientToken();
            } catch {
            }
        }

        const contentType = request.headers.get("content-type") ?? "";
        //  request.headers.delete("accept");

        if (contentType.startsWith("multipart/form-data")) {
            const body = await request.clone().formData();

            const next = new FormData();

            for (const [key, value] of body.entries())
                next.set(key, value);

            next.set("app_id", appId);
            if (userId) next.set("user_id", userId);
            if (clientToken) next.set("client_token", clientToken);

            request.headers.delete("content-type");

            return new Request(request, {body: next});

            // const boundary = crypto.randomUUID();
            // const chunks: Buffer[] = [];
            //
            // const entries = Array.from(body.entries());
            // const fieldMap = new Map<string, FormDataEntryValue>();
            // for (const [k, v] of entries) {
            //     if (k === "app_id") fieldMap.set(k, appId as FormDataEntryValue);
            //     else if (k === "user_id" && userId) fieldMap.set(k, userId as FormDataEntryValue);
            //     else if (k === "client_token" && clientToken) fieldMap.set(k, clientToken as FormDataEntryValue);
            //     else fieldMap.set(k, v);
            // }
            // if (!fieldMap.has("app_id")) fieldMap.set("app_id", appId as FormDataEntryValue);
            // if (userId && !fieldMap.has("user_id")) fieldMap.set("user_id", userId as FormDataEntryValue);
            // if (clientToken && !fieldMap.has("client_token")) fieldMap.set("client_token", clientToken as FormDataEntryValue);
            //
            // for (const [key, value] of fieldMap) {
            //     if (value instanceof Blob) {
            //         chunks.push(Buffer.from(`--${boundary}\r\n`));
            //         chunks.push(Buffer.from(`Content-Disposition: form-data; name="${key}"; filename="${value.name || "blob"}"\r\n`));
            //         chunks.push(Buffer.from(`Content-Type: ${value.type || "application/octet-stream"}\r\n`));
            //         chunks.push(Buffer.from(`Content-Length: ${value.size}\r\n\r\n`));
            //         chunks.push(Buffer.from(await value.arrayBuffer()));
            //         chunks.push(Buffer.from("\r\n"));
            //     } else {
            //         const str = String(value);
            //         const encoded = Buffer.from(str, "utf-8");
            //         chunks.push(Buffer.from(`--${boundary}\r\n`));
            //         chunks.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n`));
            //         chunks.push(Buffer.from(`Content-Length: ${encoded.length}\r\n\r\n`));
            //         chunks.push(encoded);
            //         chunks.push(Buffer.from("\r\n"));
            //     }
            // }
            // chunks.push(Buffer.from(`--${boundary}--\r\n`));
            //
            // const bodyBuffer = Buffer.concat(chunks);
            // request.headers.set("content-type", `multipart/form-data; boundary=${boundary}`);

        }

        const body = await request.clone().formData();
        const next = new URLSearchParams();

        for (const [key, value] of body.entries())
            next.set(key, value);

        next.set("app_id", appId);
        if (userId) next.set("user_id", userId);
        if (clientToken) next.set("client_token", clientToken);

        return new Request(request, {body: next});
    }
}

export function buildFormData(fields: MultipartFields): FormData {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (value == null) continue;
        if (value instanceof Blob) form.append(key, value);
        else form.append(key, String(value));
    }
    return form;
}

export async function postMultipartJson(http: KyHttpClient, url: string, fields: MultipartFields): Promise<unknown> {
    return http.ky.post(url, {body: buildFormData(fields)}).json();
}

function shouldInjectDCInsideContext(url: string): boolean {
    const {hostname} = new URL(url);
    return hostname === "app.dcinside.com"
        || hostname === "upload.dcinside.com"
        || hostname === "m4up4.dcinside.com"
        || hostname === "m.dcinside.com";
}

function redirectAppApiGet({request}: { request: Request }): Request | void {
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    const redirect = new URL(API_URL.redirect);
    if (url.origin !== redirect.origin || !url.pathname.startsWith("/api/") || url.pathname === redirect.pathname) return;

    const hash = Buffer.from(url.toString()).toString("base64");
    redirect.searchParams.set("hash", hash);
    return new Request(`${redirect.origin}${redirect.pathname}?hash=${hash}`, request);
}
