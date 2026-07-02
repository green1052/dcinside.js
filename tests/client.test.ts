import {describe, expect, test} from "bun:test";
import {DCInsideClient} from "../src";

describe("DCInsideClient", () => {
    test("creates discord.js-style managers", () => {
        const client = new DCInsideClient();

        expect(client.articles).toBeDefined();
        expect(client.comments).toBeDefined();
        expect(client.dccons).toBeDefined();
        expect(client.galleries).toBeDefined();
        expect(client.management).toBeDefined();
        expect(client.search).toBeDefined();
        expect(client.user).toBeDefined();
    });

    test("stores anonymous sessions and exposes currentUser", () => {
        const client = new DCInsideClient();
        const session = client.useAnonymous("nick", "pass");

        expect(client.session).toBe(session);
        expect(client.currentUser).toEqual({
            type: "anonymous",
            id: "nick",
            password: "pass"
        });
    });

    test("useSession sets the current session", () => {
        const client = new DCInsideClient();
        const session = client.useAnonymous("nick", "pass");

        client.useSession(session);

        expect(client.session).toBe(session);
        expect(client.currentUser).toEqual({
            type: "anonymous",
            id: "nick",
            password: "pass"
        });
    });

    test("currentUser is null when no session is set", () => {
        const client = new DCInsideClient();

        expect(client.session).toBeNull();
        expect(client.currentUser).toBeNull();
    });

    test("exposes auth manager and http client", () => {
        const client = new DCInsideClient();

        expect(client.auth).toBeDefined();
        expect(client.http).toBeDefined();
        expect(client.auth.fcmToken).toBeNull();
        expect(client.auth.firebaseInstallationId).toHaveLength(22);
    });

    test("validates article write input before network requests", async () => {
        const client = new DCInsideClient();
        client.useAnonymous("nick", "pass");

        await expect(client.articles.write({
            galleryId: "bjwg64",
            galleryType: "mini",
            subject: "   ",
            content: ["body"]
        })).rejects.toThrow("Article subject is required.");

        await expect(client.articles.write({
            galleryId: "bjwg64",
            galleryType: "mini",
            subject: "subject",
            content: []
        })).rejects.toThrow("Article content must contain at least one block.");

        await expect(client.articles.write({
            galleryId: "bjwg64",
            galleryType: "mini",
            subject: "subject",
            content: ["body"],
            mode: "modify"
        })).rejects.toThrow("articleId is required");
    });

    test("builds article write fields like the mobile app", async () => {
        const fields: [string, string][] = [];
        const client = new DCInsideClient({
            http: {
                hooks: {
                    beforeRequest: [
                        async ({request}) => {
                            for (const [key, value] of await request.clone().formData()) {
                                fields.push([key, String(value)]);
                            }
                            return new Response("[{\"result\":true,\"cause\":\"123\",\"id\":\"mi$bjwg64\"}]");
                        }
                    ]
                }
            }
        });
        client.http.useDCInsideContext({
            getAppId: async () => "app-id",
            getClientToken: () => "client-token",
            getUserId: () => "user-no"
        });
        client.useSession({
            user: {type: "login", id: "login-id", password: "login-password"},
            detail: {
                result: true,
                userId: "user-no",
                userNo: "user-no",
                name: "nick",
                sessionType: "A",
                isAdult: 0,
                isDormancy: 0,
                isOtp: 0,
                pwCampaign: 0,
                mailSend: "",
                isGonick: 0,
                isSecurityCode: "",
                authChange: 0,
                cause: null
            }
        });

        const result = await client.articles.write({
            galleryId: "bjwg64",
            galleryType: "mini",
            subject: "hello world",
            headText: {no: 999, name: "일반"},
            content: [
                "hello world",
                {type: "dccon", imageTag: "<img src=\"x\">", detailIndex: 1380306681}
            ]
        });

        expect(result.articleId).toBe(123);
        expect(fields).toContainEqual(["id", "mi$bjwg64"]);
        expect(fields).toContainEqual(["app_id", "app-id"]);
        expect(fields).toContainEqual(["mode", "write"]);
        expect(fields).toContainEqual(["client_token", "client-token"]);
        expect(fields).toContainEqual(["head_no", "999"]);
        expect(fields).toContainEqual(["subject", "hello+world"]);
        expect(fields).toContainEqual(["user_id", "user-no"]);
        expect(fields).toContainEqual(["memo_block[0]", "%3Cdiv%3Ehello+world%3C%2Fdiv%3E"]);
        expect(fields).toContainEqual(["memo_block[1]", "%3Cimg+src%3D%22x%22%3E"]);
        expect(fields).toContainEqual(["detail_idx[1]", "1380306681"]);
        expect(fields).toContainEqual(["fix", ""]);
        expect(fields).toContainEqual(["secret_use", "0"]);
        expect(fields).toContainEqual(["is_quick", "0"]);
        expect(fields).toContainEqual(["use_gall_nickname", "0"]);
        expect(fields).toContainEqual(["write_movie", "0"]);
        expect(fields.filter(([key]) => key === "user_id")).toHaveLength(1);
    });
});