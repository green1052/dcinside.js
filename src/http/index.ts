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
        const clientToken = this.context!.getClientToken();

        const contentType = request.headers.get("content-type") ?? "";
        const body = await request.clone().formData();
        const headers = new Headers(request.headers);
        headers.delete("content-type");

        if (contentType.startsWith("multipart/form-data")) {
            const next = new FormData();
            next.append("app_id", appId);
            if (userId) next.append("user_id", userId);
            if (clientToken) next.append("client_token", clientToken);
            for (const [key, value] of body.entries()) next.append(key, value);
            return new Request(request.url, {method: "POST", headers, body: next});
        }

        const next = new URLSearchParams();
        next.append("app_id", appId);
        if (userId) next.append("user_id", userId);
        if (clientToken) next.append("client_token", clientToken);
        for (const [key, value] of body.entries()) next.append(key, String(value));
        return new Request(request.url, {method: "POST", headers, body: next});
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