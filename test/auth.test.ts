import {describe, expect, test} from "bun:test";
import {ApiError, DCInside, OtpRequiredError} from "../src";
import {createCheckinRequest, parseCheckinResponse} from "../src/auth/checkin";
import {json, makeClient} from "./helpers";

describe("Auth.login", () => {
    test("posts multipart login_normal with client_token and stores the session", async () => {
        const {dc, requests} = makeClient(() => json({result: true, user_id: "uid", user_no: "1", name: "닉"}));
        const session = await dc.login("id", "pw");

        expect(requests[0]!.url.toString()).toBe("https://msign.dcinside.com/api/login");
        expect(requests[0]!.fields).toEqual({user_id: "id", user_pw: "pw", mode: "login_normal", client_token: "fcm-token"});
        expect(session.userId).toBe("uid");
        expect(dc.session).toBe(session);
    });

    test("sends otp fields and raises OtpRequiredError when asked for OTP", async () => {
        const {dc, requests} = makeClient((_, i) => json(i === 0 ? {result: false, is_otp: "1", cause: "OTP 인증이 필요합니다"} : {result: true, user_id: "u"}));
        await expect(dc.login("id", "pw")).rejects.toBeInstanceOf(OtpRequiredError);
        await dc.login("id", "pw", {otp: "123456"});
        expect(requests[1]!.fields).toMatchObject({otp_num: "123456", auth_mode: "otp"});
    });

    test("other failures are ApiError with the server cause", async () => {
        const {dc} = makeClient(() => json({result: false, cause: "비밀번호가 틀렸습니다"}));
        const error = await dc.login("id", "pw").catch((e) => e);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.cause).toBe("비밀번호가 틀렸습니다");
    });
});

describe("device issuance", () => {
    test("issues client_token and app_id with independent steps in parallel", async () => {
        const fixed64 = (field: number, value: bigint) => {
            const bytes = new Uint8Array(9);
            bytes[0] = (field << 3) | 1;
            new DataView(bytes.buffer).setBigUint64(1, value, true);
            return bytes;
        };
        const started: string[] = [];
        let verify: FormData | undefined;
        const fetchMock = (async (input: string | URL, init: RequestInit = {}) => {
            const url = new URL(String(input));
            started.push(url.hostname + url.pathname);
            await Bun.sleep(5);
            if (url.pathname === "/checkin") return new Response(new Uint8Array([...fixed64(7, 11n), ...fixed64(8, 22n)]));
            if (url.hostname.startsWith("firebaseinstallations")) return json({fid: "fid", refreshToken: "rt", authToken: {token: "fis"}});
            if (url.pathname === "/c2dm/register3") return new Response("token=FCM");
            if (url.pathname.includes("app_check")) return json([{date: "20261007"}]);
            if (url.pathname === "/auth/mobile_app_verification") {
                verify = init.body as FormData;
                return json({app_id: "NEW"});
            }
            return json({result: true});
        }) as typeof fetch;

        const dc = new DCInside({http: {fetch: fetchMock}});
        dc.auth.appIdSettleMs = 0;
        expect(await dc.auth.appId()).toBe("NEW");

        // checkin, Firebase, app_check가 먼저 동시에 시작하고 GCM 등록이 그 뒤입니다.
        expect(new Set(started.slice(0, 3))).toEqual(new Set([
            "android.clients.google.com/checkin",
            "firebaseinstallations.googleapis.com/v1/projects/dcinside-b3f40/installations",
            "json2.dcinside.com/json0/app_check_A_rina_one_new.php"
        ]));
        expect(started[3]).toBe("android.apis.google.com/c2dm/register3");
        expect(verify?.get("client_token")).toBe("FCM");
        expect(dc.auth.exportCredentials()).toMatchObject({androidId: "11", securityToken: "22", clientToken: "FCM", appId: "NEW"});
    });
});

describe("checkin protobuf", () => {
    test("request is non-empty and response parses fixed64 fields 7/8", () => {
        expect(createCheckinRequest().length).toBeGreaterThan(50);
        const fixed64 = (field: number, value: bigint) => {
            const bytes = new Uint8Array(9);
            bytes[0] = (field << 3) | 1;
            new DataView(bytes.buffer).setBigUint64(1, value, true);
            return bytes;
        };
        const response = new Uint8Array([...fixed64(7, 1234567890123n), ...fixed64(8, 987654321n)]);
        expect(parseCheckinResponse(response)).toEqual({androidId: 1234567890123n, securityToken: 987654321n});
    });
});
