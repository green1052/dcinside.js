/** dcinside.js가 던지는 모든 에러의 기본 클래스입니다. */
export class DCInsideError extends Error {
    override name = "DCInsideError";
}

/** HTTP 상태가 2xx가 아니고 본문에서 API 응답을 읽을 수 없을 때 발생합니다. */
export class HTTPError extends DCInsideError {
    override name = "HTTPError";

    constructor(readonly status: number, readonly body: string) {
        super(`HTTP ${status}`);
    }
}

/** 서버가 `result: false`와 `cause`를 돌려줬을 때 발생합니다. 원본 응답은 `response`에 있습니다. */
export class ApiError extends DCInsideError {
    override name = "ApiError";

    constructor(override readonly cause: string, readonly response: unknown) {
        super(cause || "API request failed");
    }
}

/** 캡챠(자동입력 방지 코드)가 필요할 때 발생합니다. `captchaUrl()`로 이미지를 받아 답과 함께 다시 요청하세요. */
export class CaptchaRequiredError extends ApiError {
    override name = "CaptchaRequiredError";
}

/** `app_id` 또는 로그인 세션이 만료됐고 자동 갱신도 실패했을 때 발생합니다. */
export class AuthExpiredError extends ApiError {
    override name = "AuthExpiredError";

    constructor(readonly kind: "appId" | "login", cause: string, response: unknown = null) {
        super(cause, response);
    }
}

/** 로그인 시 OTP 2차 인증이 필요할 때 발생합니다. */
export class OtpRequiredError extends ApiError {
    override name = "OtpRequiredError";
}

/** 로그인 세션이 필요한 기능을 세션 없이 호출했을 때 발생합니다. */
export class SessionRequiredError extends DCInsideError {
    override name = "SessionRequiredError";
}
