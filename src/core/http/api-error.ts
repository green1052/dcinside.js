import {AuthExpiredError, DCInsideError} from "./errors";
import {booleanValue, nullableString, objectValue} from "./json";

/** 응답 객체가 DCInside API 에러(`result=false` + `cause`) 형태인지 확인합니다. */
export function isApiError(value: unknown): boolean {
    const object = objectValue(value);
    return "result" in object && ("cause" in object || "refresh_join" in object) && !booleanValue(object["result"]);
}

/** 응답 객체의 `refresh_join`이 true이면 app_id 갱신이 필요합니다. */
export function shouldRefreshAppId(value: unknown): boolean {
    return booleanValue(objectValue(value)["refresh_join"]);
}

/** cause 문자열이 `app_id` 만료를 의미하는지 확인합니다. */
export function isAppIdExpiredCause(cause: string): boolean {
    return cause === "certification";
}

/** cause 문자열이 로그인 세션 만료를 의미하는지 확인합니다. */
export function isLoginSessionExpiredCause(cause: string): boolean {
    return cause === "certification_login";
}

/** cause 문자열로 인증 만료 종류를 판별합니다. 만료가 아니면 `null`을 반환합니다. */
export function authExpiredKind(cause: string): AuthExpiredError["kind"] | null {
    if (isAppIdExpiredCause(cause)) return "appId";
    if (isLoginSessionExpiredCause(cause)) return "loginSession";
    return null;
}

/** cause가 인증 만료면 `AuthExpiredError`를 throw 합니다. */
export function assertAuthExpired(cause: string): void {
    const kind = authExpiredKind(cause);
    if (kind) throw new AuthExpiredError(kind, cause);
}

/** 응답 객체에서 cause를 추출해 인증 만료를 검사합니다. 만료면 throw 합니다. */
export function assertResponseAuthExpired(value: unknown): void {
    const object = objectValue(value);
    if (booleanValue(object["result"])) return;
    const cause = nullableString(object["cause"]);
    if (cause) assertAuthExpired(cause);
}

export function apiError(action: string, value: unknown): DCInsideError {
    const object = objectValue(value);
    const cause = nullableString(object["cause"]) ?? "unknown error";
    return new DCInsideError(`Unable to ${action}: ${cause}`);
}