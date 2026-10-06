import {describe, expect, test} from "bun:test";
import {ApiError, OtpRequiredError} from "../src";
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
