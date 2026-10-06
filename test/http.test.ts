import {describe, expect, test} from "bun:test";
import {ApiError, AuthExpiredError, CaptchaRequiredError, HTTPError} from "../src";
import {json, loggedIn, makeClient} from "./helpers";

describe("Http", () => {
    test("wraps only the app's redirected GET paths in redirect.php", async () => {
        const {dc, requests} = makeClient(() => json({result: true}));
        await dc.http.get("https://app.dcinside.com/api/comment_new.php", {id: "a"});
        await dc.http.get("https://app.dcinside.com/api/chk_upload_restriction", {id: "a"});

        expect(new URL(requests[0]!.raw.url).pathname).toBe("/api/redirect.php");
        expect(requests[0]!.url.pathname).toBe("/api/comment_new.php");
        expect(new URL(requests[1]!.raw.url).pathname).toBe("/api/chk_upload_restriction");
    });

    test("injects app_id on app hosts only, sends POST as multipart", async () => {
        const {dc, requests} = makeClient(() => json({result: true}));
        await dc.http.post("https://app.dcinside.com/api/x", {a: 1, b: true, c: false, skip: undefined});
        await dc.http.get("https://json2.dcinside.com/json1/x.php");

        expect(requests[0]!.raw.headers.get("content-type")).toContain("multipart/form-data");
        expect(requests[0]!.fields).toEqual({a: "1", b: "1", c: "0", app_id: "APP"});
        expect(requests[1]!.fields).toEqual({});
    });

    test("refreshes app_id and retries once on cause=certification", async () => {
        const {dc, requests} = makeClient((req) => {
            if (req.url.hostname === "json2.dcinside.com") return json([{date: "20260101"}]);
            if (req.url.pathname === "/auth/mobile_app_verification") return json({result: true, app_id: "NEW"});
            return json(requests.filter((r) => r.url.pathname === "/api/x").length === 1 ? {result: false, cause: "certification"} : {result: true});
        });
        const result = await dc.http.post<{ result: boolean }>("https://app.dcinside.com/api/x", {});

        expect(result.result).toBe(true);
        const calls = requests.filter((r) => r.url.pathname === "/api/x");
        expect(calls.map((r) => r.fields["app_id"])).toEqual(["APP", "NEW"]);
        const verify = requests.find((r) => r.url.pathname === "/auth/mobile_app_verification")!;
        expect(verify.fields["value_token"]).toBe(new Bun.CryptoHasher("sha256").update("dcArdchk_20260101").digest("hex"));
        expect(verify.fields["vName"]).toBe("5.3.6");
    });

    test("treats refresh_join like an expired app_id", async () => {
        const {dc, requests} = makeClient((req) => {
            if (req.url.hostname === "json2.dcinside.com") return json({date: "d"});
            if (req.url.pathname === "/auth/mobile_app_verification") return json({app_id: "NEW"});
            return json(requests.length === 1 ? [{result: false, refresh_join: true}] : [{result: true}]);
        });
        await dc.http.get("https://app.dcinside.com/api/gall_list_new.php", {id: "x"});
        expect(requests.at(-1)!.fields["app_id"]).toBe("NEW");
    });

    test("gives up with AuthExpiredError when the retry also expires", async () => {
        const {dc} = makeClient((req) => {
            if (req.url.hostname === "json2.dcinside.com") return json({date: "d"});
            if (req.url.pathname === "/auth/mobile_app_verification") return json({app_id: "NEW"});
            return json({result: false, cause: "certification"});
        });
        await expect(dc.http.post("https://app.dcinside.com/api/x")).rejects.toBeInstanceOf(AuthExpiredError);
    });

    test("re-logs in with login_quick on certification_login", async () => {
        const {dc, requests} = makeClient((req) => {
            if (req.url.pathname === "/api/login") return json({result: true, user_id: "myid"});
            return json(requests.length === 1 ? {result: false, cause: "certification_login"} : {result: true});
        }, loggedIn);
        await dc.http.post("https://app.dcinside.com/api/x");

        const login = requests.find((r) => r.url.pathname === "/api/login")!;
        expect(login.fields["mode"]).toBe("login_quick");
        expect(requests.at(-1)!.url.pathname).toBe("/api/x");
    });

    test("maps result=false to ApiError and captcha causes to CaptchaRequiredError", async () => {
        const {dc} = makeClient((req) => json(req.url.pathname === "/a" ? {result: false, cause: "삭제된 글"} : [{result: "false", cause: "자동입력 방지코드를 입력해주세요"}]));
        const error = await dc.http.post("https://app.dcinside.com/a").catch((e) => e);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.cause).toBe("삭제된 글");
        await expect(dc.http.post("https://app.dcinside.com/b")).rejects.toBeInstanceOf(CaptchaRequiredError);
    });

    test("parses JSONP bodies, unwraps arrays, and keeps lists when asked", async () => {
        const {dc} = makeClient(() => new Response("([{\"name\":\"a\"},{\"name\":\"b\"}])"));
        expect(await dc.http.get("https://json2.dcinside.com/x")).toEqual({name: "a"});
        expect(await dc.http.get("https://json2.dcinside.com/x", {}, {list: true})).toEqual([{name: "a"}, {name: "b"}]);
    });

    test("throws HTTPError for non-JSON error bodies", async () => {
        const {dc} = makeClient(() => new Response("oops", {status: 502}));
        await expect(dc.http.get("https://app.dcinside.com/x")).rejects.toBeInstanceOf(HTTPError);
    });
});
