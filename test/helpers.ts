import {DCInside, type Session} from "../src";

export interface Captured {
    method: string;
    url: URL;
    /** GET이면 쿼리, POST면 폼 필드입니다. redirect.php로 감싼 GET은 원래 URL을 풀어 둡니다. */
    fields: Record<string, string>;
    files: Record<string, File>;
    raw: Request;
}

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status});

/** fetch를 가로채 요청을 기록하는 클라이언트를 만듭니다. app_id는 미리 발급된 상태입니다. */
export function makeClient(respond: (req: Captured, index: number) => Response | Promise<Response>, session?: Session) {
    const requests: Captured[] = [];
    const fetchMock = (async (input: string | URL, init: RequestInit = {}) => {
        const raw = new Request(input, init);
        const captured = await capture(raw);
        requests.push(captured);
        return respond(captured, requests.length - 1);
    }) as typeof fetch;

    const dc = new DCInside({
        http: {fetch: fetchMock},
        credentials: {
            androidId: "1", securityToken: "2", fid: "fid", refreshToken: "rt",
            clientToken: "fcm-token", appId: "APP", appIdIssuedAt: Date.now()
        },
        ...(session ? {session} : {})
    });
    dc.auth.appIdSettleMs = 0;
    return {dc, requests};
}

async function capture(raw: Request): Promise<Captured> {
    let url = new URL(raw.url);
    const fields: Record<string, string> = {};
    const files: Record<string, File> = {};
    if (raw.method === "GET") {
        const hash = url.searchParams.get("hash");
        if (url.pathname === "/api/redirect.php" && hash) url = new URL(Buffer.from(hash, "base64").toString());
        url.searchParams.forEach((value, key) => (fields[key] = value));
    } else {
        const type = raw.headers.get("content-type") ?? "";
        if (type.includes("multipart/form-data") || type.includes("urlencoded")) {
            (await raw.clone().formData()).forEach((value, key) => {
                if (typeof value === "string") fields[key] = value;
                else files[key] = value;
            });
        }
    }
    return {method: raw.method, url, fields, files, raw};
}

export const anonymous: Session = {type: "anonymous", nickname: "ㅇㅇ", password: "1234"};
export const loggedIn: Session = {type: "login", id: "myid", password: "pw", userId: "myid", result: {result: true, user_id: "myid", user_no: "77"}};
