import {describe, expect, test} from "bun:test";
import {DCInsideClient} from "../src";

const testCredentials = {
    androidId: "1",
    securityToken: "2",
    fid: "test-fid",
    refreshToken: "test-refresh-token",
    clientToken: "client-token",
    appId: "app-id",
    appIdIssuedAt: Date.now(),
    appCheckDate: "20260703",
    lastAppCheckTime: Date.now()
} as const;

describe("DCInsideClient", () => {
    test("creates discord.js-style managers", () => {
        const client = new DCInsideClient();

        expect(client.dccons).toBeDefined();
        expect(client.galleries).toBeDefined();
        expect(client.management).toBeDefined();
        expect(client.search).toBeDefined();
        expect(client.user).toBeDefined();
    });

    test("stores raw gallery keys in gallery scopes", () => {
        const client = new DCInsideClient();

        expect(client.gallery("football_new9").gallery).toBe("football_new9");
        expect(client.gallery("mi$bjwg64").gallery).toBe("mi$bjwg64");
        expect(client.gallery("pr$dororong").gallery).toBe("pr$dororong");
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
        expect(client.auth.firebaseInstallationId).toBeNull();
    });

    test("validates article write input before network requests", async () => {
        const client = new DCInsideClient();
        client.useAnonymous("nick", "pass");
        const gallery = client.gallery("mi$bjwg64");

        await expect(gallery.articles.write({
            subject: "   ",
            content: ["body"]
        })).rejects.toThrow("Article subject is required.");

        await expect(gallery.articles.write({
            subject: "subject",
            content: []
        })).rejects.toThrow("Article content must contain at least one block.");

        await expect(gallery.articles.write({
            subject: "subject",
            content: ["body"],
            mode: "modify"
        })).rejects.toThrow("articleId is required");
    });

    test("builds article write fields like the mobile app", async () => {
        const fields: [string, string][] = [];
        const client = new DCInsideClient({
            credentials: testCredentials,
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
            ensureClientToken: async () => "client-token",
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
        const gallery = client.gallery("mi$bjwg64");

        const result = await gallery.articles.write({
            subject: "hello world",
            headText: {no: 0, name: "일반"},
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
        expect(fields).toContainEqual(["head_no", "0"]);
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

    test("scopes gallery and article context for nested APIs", async () => {
        const requests: Array<{ method: string; url: string }> = [];
        const client = new DCInsideClient({
            credentials: testCredentials,
            http: {
                hooks: {
                    beforeRequest: [
                        ({request}) => {
                            requests.push({
                                method: request.method,
                                url: request.url
                            });

                            if (request.url.includes("gall_list_new.php")) {
                                return new Response("{\"gall_info\":{},\"gall_list\":[]}");
                            }

                            return new Response("{\"total_comment\":0,\"total_page\":0,\"re_page\":1,\"comment_list\":[]}");
                        }
                    ]
                }
            }
        });

        const gallery = client.gallery("mi$bjwg64");
        const article = gallery.article(123);

        await gallery.articles.list();
        await article.comments.list();

        const firstUrl = new URL(requests[0]!.url);
        const secondUrl = new URL(requests[1]!.url);
        const firstTarget = Buffer.from(firstUrl.searchParams.get("hash") ?? "", "base64").toString("utf8");
        const secondTarget = Buffer.from(secondUrl.searchParams.get("hash") ?? "", "base64").toString("utf8");

        expect(gallery.gallery).toBe("mi$bjwg64");
        expect(requests[0]?.url).toContain("redirect.php");
        expect(requests[1]?.url).toContain("redirect.php");
        expect(firstTarget).toContain("id=mi%24bjwg64");
        expect(secondTarget).toContain("id=mi%24bjwg64");
        expect(secondTarget).toContain("no=123");
        expect(article.articleId).toBe(123);
    });

    test("accepts a single gallery key in direct manager calls", async () => {
        const requests: string[] = [];
        const client = new DCInsideClient({
            credentials: testCredentials,
            http: {
                hooks: {
                    beforeRequest: [
                        ({request}) => {
                            requests.push(request.url);
                            return new Response("{\"gall_info\":{},\"gall_list\":[]}");
                        }
                    ]
                }
            }
        });

        await client.gallery("krstock").articles.list();

        const redirected = new URL(requests[0]!);
        const target = Buffer.from(redirected.searchParams.get("hash") ?? "", "base64").toString("utf8");
        expect(target).toContain("id=krstock");
    });

});
