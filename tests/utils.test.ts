import {describe, expect, test} from "bun:test";
import {inferGalleryType, KyHttpClient, normalizeGalleryId} from "../src";
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

    test("escapes HTML like KotlinInside text content conversion", () => {
        expect(escapeHtml("<a&b>\n\t  x")).toBe("&lt;a&amp;b&gt;<br>&nbsp; &nbsp; &nbsp; &nbsp;x");
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

    test("adds auth fields to DCInside form requests", async () => {
        const fields: Record<string, string> = {};
        const http = new KyHttpClient({
            hooks: {
                beforeRequest: [
                    async ({request}) => {
                        for (const [key, value] of await request.clone().formData()) {
                            fields[key] = String(value);
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

        await postMultipartJson(http, "https://app.dcinside.com/api/example", {
            id: "gallery"
        });

        expect(fields).toMatchObject({
            id: "gallery",
            app_id: "app-id",
            user_id: "user-no",
            client_token: "client-token"
        });
    });

    test("normalizes typed gallery ids", () => {
        expect(normalizeGalleryId("football_new9", "main")).toBe("football_new9");
        expect(normalizeGalleryId("singlebungle1472", "minor")).toBe("singlebungle1472");
        expect(normalizeGalleryId("rohmoohyunpresident", "mini")).toBe("mi$rohmoohyunpresident");
        expect(normalizeGalleryId("mi$rohmoohyunpresident", "mini")).toBe("mi$rohmoohyunpresident");
        expect(normalizeGalleryId("bones", "person")).toBe("pr$bones");
        expect(normalizeGalleryId("pr$bones", "person")).toBe("pr$bones");
    });

    test("infers prefixed gallery id types", () => {
        expect(inferGalleryType("mi$rohmoohyunpresident")).toBe("mini");
        expect(inferGalleryType("pr$bones")).toBe("person");
        expect(inferGalleryType("football_new9")).toBe("main");
    });
});