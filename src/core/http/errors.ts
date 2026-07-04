/**
 * dcinside.js의 모든 에러가 상속하는 기본 에러 클래스입니다.
 */
export class DCInsideError extends Error {
    override name = "DCInsideError";
}

/** HTTP 응답 상태가 2xx가 아닐 때 발생. */
export class HTTPError extends DCInsideError {
    override name = "HTTPError";

    constructor(
        message: string,
        readonly statusCode?: number,
        readonly response?: Response
    ) {
        super(message);
    }
}

/** 인증/로그인/app_id 발급 실패 시 발생. */
export class AuthenticationError extends DCInsideError {
    override name = "AuthenticationError";
}

/** 권한이 필요한 작업에 세션/권한이 없을 때 발생. */
export class PermissionError extends DCInsideError {
    override name = "PermissionError";
}

/** 캡챠(보안코드) 입력이 필요할 때 발생. 글/댓글 작성, 추천, 로그인 등에서 던져집니다. */
export class CaptchaRequiredError extends DCInsideError {
    override name = "CaptchaRequiredError";

    /** 캡챠를 요구한 작업 종류입니다. */
    readonly action: CaptchaAction;
    /** 서버가 내려준 캡챠 챌린지 정보입니다. 이미지 URL과 세션 식별자를 포함할 수 있습니다. */
    readonly challenge: import("../types").CaptchaChallenge;

    constructor(
        message: string,
        action: CaptchaAction,
        challenge: import("../types").CaptchaChallenge = {}
    ) {
        super(message);
        this.action = action;
        this.challenge = challenge;
    }
}

/** 로그인 시 2차 인증(OTP)이 필요할 때 발생. */
export class LoginOtpRequiredError extends DCInsideError {
    override name = "LoginOtpRequiredError";
}

/** 로그인 시 캡챠(보안코드) 입력이 필요할 때 발생. */
export class LoginCaptchaRequiredError extends DCInsideError {
    override name = "LoginCaptchaRequiredError";
}

/** `app_id` 또는 로그인 세션이 만료되었을 때 발생. cause 토큰으로 종류를 구분합니다. */
export class AuthExpiredError extends DCInsideError {
    override name = "AuthExpiredError";

    /** 만료된 인증의 종류입니다. */
    readonly kind: AuthExpiredKind;
    /** 서버가 반환한 cause 메시지입니다. */
    override readonly cause: string;

    constructor(kind: AuthExpiredKind, cause: string) {
        super(`Auth expired (${kind}): ${cause}`);
        this.kind = kind;
        this.cause = cause;
    }
}

export type CaptchaAction = "writeArticle" | "modifyArticle" | "writeComment" | "writeReply" | "voteArticle" | "login";

export type AuthExpiredKind = "appId" | "loginSession";
