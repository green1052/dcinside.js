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
