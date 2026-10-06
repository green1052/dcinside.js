import {APP, HOST, REDIRECTED_PATHS} from "./constants";
import {ApiError, AuthExpiredError, CaptchaRequiredError, HTTPError} from "./errors";
import {first, isCaptchaCause, isFailure, list, parseJson} from "./util";

/** 폼/쿼리 필드 값입니다. `null`/`undefined`는 생략하고, boolean은 앱처럼 `"1"`/`"0"`으로 보냅니다. */
export type FieldValue = string | number | boolean | Blob | null | undefined;
export type Fields = Record<string, FieldValue>;

export interface HttpOptions {
    /** 직접 만든 fetch를 씁니다. Node에서 프록시(undici dispatcher)를 쓸 때 여기에 넘기세요. */
    fetch?: typeof fetch;
    /** Bun의 `fetch(…, {proxy})`로 보낼 프록시 URL입니다. */
    proxy?: string;
    /** 요청 제한 시간(ms)입니다. 기본 30초입니다. */
    timeout?: number;
    /** 모든 요청에 덧붙일 헤더입니다. */
    headers?: Record<string, string>;
}

export interface RequestOptions {
    /** `app_id`를 자동으로 붙일지 여부입니다. 기본값은 app/upload/m 호스트에서 `true`입니다. */
    appId?: boolean;
    /** 응답을 배열로 돌려받습니다. 기본은 첫 객체입니다. */
    list?: boolean;
    /** `result: false`를 에러로 바꾸지 않고 그대로 돌려받습니다. */
    raw?: boolean;
    /** POST 본문을 multipart 대신 urlencoded로 보냅니다. 모바일 웹 엔드포인트용입니다. */
    urlencoded?: boolean;
    /** 이 요청에만 덧붙일 헤더입니다. */
    headers?: Record<string, string>;
}

/** HTTP 레이어가 인증 정보를 얻고 갱신하는 통로입니다. `DCInside`가 연결합니다. */
export interface AuthContext {
    appId(): Promise<string>;
    refreshAppId(): Promise<unknown>;
    /** 저장된 로그인 정보로 다시 로그인합니다. 로그인 세션이 없으면 `false`입니다. */
    relogin(): Promise<boolean>;
}

const APP_ID_HOSTS = new Set([HOST.app, HOST.upload, HOST.mobile].map((url) => new URL(url).host));

/**
 * 공식 앱의 `ApiBase`와 같은 규칙으로 요청을 보냅니다.
 *
 * - POST는 항상 multipart/form-data입니다.
 * - 앱이 감싸는 GET은 `redirect.php?hash=`로 보냅니다.
 * - 응답 cause가 `certification`이면 `app_id`를, `certification_login`이면 로그인을 갱신해 한 번 다시 보냅니다.
 */
export class Http {
    context: AuthContext | null = null;
    private readonly fetcher: typeof fetch;

    constructor(private readonly options: HttpOptions = {}) {
        this.fetcher = options.fetch ?? fetch;
    }

    /** 기본 헤더/프록시/타임아웃을 적용한 fetch입니다. 인증 주입과 재시도는 하지 않습니다. */
    fetch(url: string | URL, init: RequestInit = {}): Promise<Response> {
        const headers = new Headers({"User-Agent": APP.userAgent, Referer: APP.referer, ...this.options.headers});
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
        return this.fetcher(url, {
            ...init,
            headers,
            signal: init.signal ?? AbortSignal.timeout(this.options.timeout ?? 30_000),
            ...(this.options.proxy ? {proxy: this.options.proxy} : {})
        } as RequestInit);
    }

    get<T>(url: string, query: Fields = {}, options: RequestOptions = {}): Promise<T> {
        return this.send("GET", url, query, options) as Promise<T>;
    }

    post<T>(url: string, fields: Fields = {}, options: RequestOptions = {}): Promise<T> {
        return this.send("POST", url, fields, options) as Promise<T>;
    }

    private async send(method: "GET" | "POST", url: string, fields: Fields, options: RequestOptions, retried = false): Promise<unknown> {
        const target = new URL(url);
        const all: Fields = {...fields};
        if (this.context && (options.appId ?? APP_ID_HOSTS.has(target.host)) && all["app_id"] === undefined) {
            all["app_id"] = await this.context.appId();
        }

        const response = method === "GET"
            ? await this.fetch(this.buildGetUrl(target, all), {headers: options.headers})
            : await this.fetch(target, {method, headers: options.headers, body: options.urlencoded ? toSearchParams(all) : toFormData(all)});
        const text = await response.text();
        const json = parseJson(text);
        if (json === undefined) {
            if (!response.ok) throw new HTTPError(response.status, text);
            return text;
        }

        const object = first(json);
        const cause = typeof object["cause"] === "string" ? object["cause"] : "";
        const expired = cause === "certification" || object["refresh_join"] === true ? "appId"
            : cause === "certification_login" ? "login" : null;
        if (expired && this.context) {
            if (retried) throw new AuthExpiredError(expired, cause, json);
            if (expired === "appId") await this.context.refreshAppId();
            else if (!(await this.context.relogin())) throw new AuthExpiredError("login", cause, json);
            // 원래 필드로 다시 보내야 새 app_id가 주입됩니다.
            return this.send(method, url, fields, options, true);
        }

        if (!options.raw && isFailure(object)) {
            const message = cause || (typeof object["msg"] === "string" ? object["msg"] : "");
            throw isCaptchaCause(message) ? new CaptchaRequiredError(message, json) : new ApiError(message, json);
        }
        if (!response.ok) throw new HTTPError(response.status, text);
        return options.list ? list(json) : Array.isArray(json) || isNumericKeyed(json) ? first(json) : json;
    }

    private buildGetUrl(target: URL, query: Fields): URL {
        for (const [key, value] of Object.entries(query)) {
            if (value != null && !(value instanceof Blob)) target.searchParams.set(key, scalar(value));
        }
        if (target.origin !== HOST.app || !REDIRECTED_PATHS.has(target.pathname)) return target;
        const redirect = new URL("/api/redirect.php", HOST.app);
        redirect.searchParams.set("hash", Buffer.from(target.toString()).toString("base64"));
        return redirect;
    }
}

function isNumericKeyed(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const keys = Object.keys(value);
    return keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
}

const scalar = (value: string | number | boolean) => (typeof value === "boolean" ? (value ? "1" : "0") : String(value));

function toSearchParams(fields: Fields): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) {
        if (value != null && !(value instanceof Blob)) params.set(key, scalar(value));
    }
    return params;
}

export function toFormData(fields: Fields): FormData {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (value == null) continue;
        if (value instanceof Blob) form.append(key, value, value instanceof File ? value.name : "blob");
        else form.append(key, scalar(value));
    }
    return form;
}
