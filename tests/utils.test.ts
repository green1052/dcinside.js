import {describe, expect, test} from "bun:test";
import {inferGalleryType, KyHttpClient, normalizeGalleryId, normalizeGalleryType} from "../src";
import {postMultipartJson} from "../src/http";
import {
    arrayValue,
    booleanValue,
    nullableNumber,
    nullableString,
    numberValue,
    objectValue,
    stringValue,
    ynBoolean
} from "../src/http/json";
import {escapeHtml} from "../src/http/utils";

describe("JSON and utility helpers", () => {
    test("coerces primitive API values", () => {
        expect(ynBoolean("Y")).toBe(true);
        expect(ynBoolean("N")).toBe(false);
        expect(booleanValue("1")).toBe(true);
        expect(booleanValue("false")).toBe(false);
        expect(numberValue("42")).toBe(42);
        expect(numberValue("nope", 7)).toBe(7);
        expect(nullableNumber("")).toBeNull();
        expect(nullableString("")).toBeNull();
        expect(stringValue(null, "fallback")).toBe("fallback");
    });

    test("normalizes array/object inputs", () => {
        expect(arrayValue([1, 2])).toEqual([1, 2]);
        expect(arrayValue({})).toEqual([]);
        expect(objectValue({ok: true})).toEqual({ok: true});
        expect(objectValue([])).toEqual({});
    });

    test("escapes HTML like KotlinInside toHtml", () => {
        expect(escapeHtml("<a&b>\n\t  x")).toBe("&lt;a&amp;b&gt;<br>&nbsp; &nbsp; &nbsp; &nbsp;x");
    });

    test("does not escape single quotes (KotlinInside compatible)", () => {
        expect(escapeHtml("it's")).toBe("it's");
    });

    test("does not double-encode existing entities", () => {
        expect(escapeHtml("&amp;")).toBe("&amp;amp;");
        expect(escapeHtml("&nbsp;")).toBe("&amp;nbsp;");
    });

    test("preserves Korean characters without encoding", () => {
        expect(escapeHtml("한글")).toBe("한글");
    });

    test("redirects app API GET requests through the ky hook", async () => {
        const target = "https://app.dcinside.com/api/example?id=test";
        let redirectedUrl = "";
        const http = new KyHttpClient({
            hooks: {
                beforeRequest: [
                    ({request}) => {
                        redirectedUrl = request.url;
                        return new Response("{}");
                    }
                ]
            }
        });

        await http.ky.get(target).json();

        const expectedHash = Buffer.from(target).toString("base64");
        expect(redirectedUrl).toBe(`https://app.dcinside.com/api/redirect.php?hash=${expectedHash}`);
    });

    test("adds auth fields to DCInside GET requests before redirecting", async () => {
        let redirectedUrl = "";
        const http = new KyHttpClient({
            hooks: {
                beforeRequest: [
                    ({request}) => {
                        redirectedUrl = request.url;
                        return new Response("{}");
                    }
                ]
            }
        });
        http.useDCInsideContext({
            getAppId: async () => "app-id",
            getClientToken: () => "client-token",
            getUserId: () => "user-no"
        });

        await http.ky.get("https://app.dcinside.com/api/example?id=test").json();

        const redirected = new URL(redirectedUrl);
        const target = Buffer.from(redirected.searchParams.get("hash")!, "base64").toString();
        const targetUrl = new URL(target);
        expect(targetUrl.searchParams.get("app_id")).toBe("app-id");
        expect(targetUrl.searchParams.get("confirm_id")).toBe("user-no");
    });

    test("adds auth fields to DCInside multipart form requests in field order", async () => {
        const fields: [string, string][] = [];
        const http = new KyHttpClient({
            hooks: {
                beforeRequest: [
                    async ({request}) => {
                        for (const [key, value] of await request.clone().formData()) {
                            fields.push([key, String(value)]);
                        }
                        return new Response("{}");
                    }
                ]
            }
        });
        http.useDCInsideContext({
            getAppId: async () => "app-id",
            getClientToken: () => "client-token",
            getUserId: () => "user-no"
        });

        await postMultipartJson(http, "https://upload.dcinside.com/_app_write_api.php", {
            id: "mi$bjwg64",
            mode: "write",
            subject: "test",
            "memo_block[0]": "<div>test</div>"
        });

        const keys = fields.map(([key]) => key);
        expect(keys).toContain("app_id");
        expect(keys).toContain("client_token");
        expect(keys).toContain("user_id");

        // app_id should be injected right after id
        expect(keys[keys.indexOf("app_id") - 1]).toBe("id");
        // client_token should be injected right after mode
        expect(keys[keys.indexOf("client_token") - 1]).toBe("mode");
        // user_id should be injected right after memo_block[0]
        expect(keys[keys.indexOf("user_id") - 1]).toBe("memo_block[0]");
    });

    test("adds missing auth fields even when expected anchor fields are absent", async () => {
        const fields: [string, string][] = [];
        const http = new KyHttpClient({
            hooks: {
                beforeRequest: [
                    async ({request}) => {
                        for (const [key, value] of await request.clone().formData()) {
                            fields.push([key, String(value)]);
                        }
                        return new Response("{}");
                    }
                ]
            }
        });
        http.useDCInsideContext({
            getAppId: async () => "app-id",
            getClientToken: () => "client-token",
            getUserId: () => "user-no"
        });

        await postMultipartJson(http, "https://app.dcinside.com/api/comment_ok.php", {
            id: "mi$bjwg64",
            no: 1,
            comment_memo: "test"
        });

        expect(fields).toContainEqual(["app_id", "app-id"]);
        expect(fields).toContainEqual(["client_token", "client-token"]);
        expect(fields).toContainEqual(["user_id", "user-no"]);
    });

    test("normalizes typed gallery ids", () => {
        expect(normalizeGalleryId("football_new9", "main")).toBe("football_new9");
        expect(normalizeGalleryId("krstock", "minor")).toBe("krstock");
        expect(normalizeGalleryId("bjwg64", "mini")).toBe("mi$bjwg64");
        expect(normalizeGalleryId("mi$bjwg64", "mini")).toBe("mi$bjwg64");
        expect(normalizeGalleryId("dororong", "person")).toBe("pr$dororong");
        expect(normalizeGalleryId("pr$dororong", "person")).toBe("pr$dororong");
    });

    test("normalizes gallery type with default main", () => {
        expect(normalizeGalleryType(undefined)).toBe("main");
        expect(normalizeGalleryType("main")).toBe("main");
        expect(normalizeGalleryType("minor")).toBe("minor");
        expect(normalizeGalleryType("mini")).toBe("mini");
        expect(normalizeGalleryType("person")).toBe("person");
    });

    test("infers prefixed gallery id types", () => {
        expect(inferGalleryType("mi$bjwg64")).toBe("mini");
        expect(inferGalleryType("pr$dororong")).toBe("person");
        expect(inferGalleryType("football_new9")).toBe("main");
    });
});
