import ky, {type KyInstance, type Options} from "ky";
import type {EnvHttpProxyAgent, ProxyAgent} from "undici-types";
import {authExpiredKind} from "./api-error";
import {API_URL} from "./constants";
import {HTTPError} from "./errors";
import {defaultHeaders} from "./utils";

export interface ProxyOptions {
    /** Bun 런타임에서 사용할 HTTP/HTTPS 프록시 URL입니다. */
    proxy?: string;
    /** Node.js 런타임에서 ky/fetch에 전달할 undici dispatcher입니다. */
    dispatcher?: ProxyAgent | EnvHttpProxyAgent;
}

export {AuthExpiredError} from "./errors";
export {authExpiredKind, assertAuthExpired, isAppIdExpiredCause, isLoginSessionExpiredCause} from "./api-error";

export interface DCInsideRequestContext {
    /** 요청에 넣을 `app_id`를 반환합니다. 필요하면 내부에서 새로 발급합니다. */
    getAppId: () => Promise<string>;
    /** 이미 발급된 `client_token`을 반환합니다. 없으면 `null`입니다. */
    getClientToken: () => string | null;
    /** 요청 전에 `client_token`이 필요할 때 새로 발급하거나 캐시 값을 반환합니다. */
    ensureClientToken: () => Promise<string>;
    /** 로그인 세션의 DCInside 사용자 식별자를 반환합니다. 익명 세션이면 `null`입니다. */
    getUserId: () => string | null;
    /** `app_id`를 강제로 재발급합니다. 인증 만료 응답을 받았을 때 호출합니다. */
    refreshAppId: () => Promise<string>;
    /** 로그인 세션을 갱신합니다. 세션 만료 응답을 받았을 때 호출합니다. */
    refreshLogin: () => Promise<unknown>;
}

export type MultipartValue =
    string
    | number
    | boolean
    | Blob
    | File
    | null
    | undefined
    | readonly (string | number | boolean)[];

export type MultipartFields = Record<string, MultipartValue>;

export class KyHttpClient {
    readonly ky: KyInstance;
    private context: DCInsideRequestContext | null = null;

    constructor(options: Options & ProxyOptions = {}) {
        const {proxy, dispatcher, ...kyOptions} = options;
        const isBun = typeof process.versions.bun === "string";

        const proxyFetch = async (input: string | URL | Request, init?: RequestInit) =>
            isBun ? fetch(input, {...init, proxy}) : fetch(input, init);

        this.ky = ky.create({
            fetch: proxyFetch,
            dispatcher,
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
                    async ({request, response}) => {
                        if (response.ok) return;
                        const cause = await readCauseFromResponse(response.clone());
                        const kind = cause ? authExpiredKind(cause) : null;
                        if (kind === "appId" && this.context) {
                            await this.context.refreshAppId();
                            return ky(request);
                        }
                        if (kind === "loginSession" && this.context) {
                            await this.context.refreshLogin();
                            return ky(request);
                        }
                        throw new HTTPError(
                            `HTTP Error: ${response.status} ${response.statusText}`.trim(),
                            response.status,
                            response
                        );
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
        request.headers.delete("accept");

        if (contentType.startsWith("multipart/form-data")) {
            const body = await request.clone().formData();

            const next = new FormData();

            for (const [key, value] of body.entries())
                next.append(key, value);

            next.set("app_id", appId);
            if (userId) next.set("user_id", userId);
            if (clientToken) next.set("client_token", clientToken);

            request.headers.delete("content-type");

            return new Request(request, {body: next});
        }

        if (!contentType.startsWith("application/x-www-form-urlencoded")) return request;

        const body = await request.clone().formData();
        const next = new URLSearchParams();

        for (const [key, value] of body.entries()) {
            if (typeof value !== "string") continue;
            next.set(key, value);
        }

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
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item == null) continue;
                form.append(key, item instanceof Blob ? item : String(item));
            }
            continue;
        }
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

/** 응답 본문에서 DCInside API cause 문자열을 추출합니다. JSON 배열이면 첫 번째 요소에서, 객체면 직접 추출합니다. JSON이 아니거나 cause가 없으면 빈 문자열을 반환합니다. */
async function readCauseFromResponse(response: { json(): Promise<unknown> }): Promise<string> {
    try {
        const json = await response.json();
        const value = Array.isArray(json) ? json[0] : json;
        if (value && typeof value === "object" && !Array.isArray(value)) {
            const cause = (value as Record<string, unknown>)["cause"];
            if (typeof cause === "string") return cause;
        }
    } catch {
    }
    return "";
}