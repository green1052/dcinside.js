import type {CaptchaChallenge} from "../types/captcha";
import {AuthExpiredError, DCInsideError} from "./errors";
import {booleanValue, firstNonEmptyString, nullableString, objectValue} from "./json";

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

/** cause 문자열이 캡챠(보안코드) 필요를 의미하는지 확인합니다. 대소문자 구분 없이 `captcha`/`보안코드`/`자동입력`/`코드`를 찾습니다. */
export function isCaptchaCause(cause: string): boolean {
    const normalized = cause.toLowerCase();
    return normalized.includes("captcha") || cause.includes("보안코드") || cause.includes("자동입력") || cause.includes("코드");
}

/** 응답에서 캡챠 챌린지 정보(이미지 URL, 세션 식별자)를 추출합니다. 여러 키 후보를 순회하며 첫 값을 채택합니다. */
export function readCaptchaChallenge(raw: unknown): CaptchaChallenge {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const object = value as Record<string, unknown>;
    const imageUrl = firstNonEmptyString(object, ["captcha_url", "captchaUrl", "captcha_img", "captchaImg", "captcha_image", "captchaImage", "kcaptcha", "image", "img", "src", "url", "recommend_captcha"]);
    const captcha = firstNonEmptyString(object, ["captcha", "captcha_id", "captchaId", "code", "session", "key"]);
    const challenge: CaptchaChallenge = {};
    if (imageUrl && /^https?:\/\//.test(imageUrl)) challenge.imageUrl = imageUrl;
    if (captcha) challenge.captcha = captcha;
    return challenge;
}