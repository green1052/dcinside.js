import type {AuthManager} from "../src/core/auth";
import {KyHttpClient} from "../src/core/http";
import type {Session} from "../src/core/types";

/** AuthManager 구조 목업. private 필드가 있어 unknown 경유 캐스팅합니다. */
export function mockAuth(overrides: Record<string, unknown> = {}) {
    const calls = {refreshAppId: 0};
    const auth = {
        fcmToken: "fcm-token",
        getAppId: async () => "app-id",
        refreshAppId: async () => {
            calls.refreshAppId++;
            return "app-id-new";
        },
        ...overrides
    };
    return {auth: auth as unknown as AuthManager, calls};
}

/** 요청을 기록하는 fetch 목업으로 KyHttpClient를 만듭니다. respond는 요청마다 순서대로 호출됩니다. */
export function mockHttp(respond: (request: Request, index: number) => Response | Promise<Response>) {
    const requests: Request[] = [];
    let index = 0;
    const fetchMock = (async (input: Request) => {
        const request = input.clone();
        requests.push(request);
        return respond(request, index++);
    }) as unknown as typeof fetch;
    return {http: new KyHttpClient({fetch: fetchMock}), requests};
}

export const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), {status});

/** redirect.php?hash=... 로 감싸진 GET 요청 URL을 복원합니다. 감싸지 않았으면 원본 URL을 반환합니다. */
export function unwrapHash(request: Request): URL {
    const hash = new URL(request.url).searchParams.get("hash");
    return hash ? new URL(Buffer.from(hash, "base64").toString()) : new URL(request.url);
}

export const anonymousSession: Session = {user: {type: "anonymous", id: "nick", password: "pw"}, detail: null};

export const loginSession: Session = {
    user: {type: "login", id: "user-id", password: "pw"},
    detail: {
        result: true,
        userId: "confirm-user",
        userNo: "1",
        name: "닉네임",
        sessionType: "1",
        isAdult: 0,
        isDormancy: 0,
        isOtp: 0,
        pwCampaign: 0,
        mailSend: "",
        isGonick: 0,
        isSecurityCode: "N",
        authChange: "",
        cause: null
    }
};
