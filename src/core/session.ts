import type {Session} from "./types";

/**
 * 세션이 필요한 작업에서 현재 세션을 가져오거나 에러를 던집니다.
 * 익명 세션과 로그인 세션 모두 허용합니다.
 */
export function requireSession(getSession: () => Session | null, action: string): Session {
    const session = getSession();
    if (!session) {
        throw new Error(`A session is required to ${action}. Call client.login(...) or client.useAnonymous(...).`);
    }
    return session;
}

/**
 * 로그인 세션이 필요한 작업에서 현재 세션을 가져오거나 에러를 던집니다.
 * 상세 정보(`detail`)가 포함된 로그인 세션만 허용합니다.
 */
export function requireLoginSession(getSession: () => Session | null, action?: string): Session {
    const session = getSession();
    if (!session?.detail) {
        throw new Error(
            action
                ? `A logged-in session is required to ${action}. Call client.login(...).`
                : "A logged-in session is required. Call client.login(...)."
        );
    }
    return session;
}