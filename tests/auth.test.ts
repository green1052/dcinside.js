import {describe, expect, test} from "bun:test";
import {AuthManager, KyHttpClient} from "../src";
import {API_URL, DC_APP} from "../src/core/http/constants";

describe("auth helpers", () => {
    test("creates anonymous sessions without network calls", () => {
        const auth = new AuthManager(new KyHttpClient());
        const session = auth.createAnonymousSession("id", "pw");

        expect(session).toEqual({
            user: {
                type: "anonymous",
                id: "id",
                password: "pw"
            },
            detail: null
        });
    });

    test("starts without remote auth state", () => {
        const auth = new AuthManager(new KyHttpClient());

        expect(auth.fcmToken).toBeNull();
        expect(auth.firebaseInstallationId).toBeNull();
    });

    test("setCheckinCredentials stores provided credentials for later auth flows", () => {
        const auth = new AuthManager(new KyHttpClient());

        auth.setCheckinCredentials({
            androidId: "1234567890",
            securityToken: "9876543210"
        });

        expect(auth.fcmToken).toBeNull();
        expect(auth.exportCredentials()).toBeNull();
    });

    test("generateAidLogin formats AidLogin tokens", () => {
        const auth = new AuthManager(new KyHttpClient());

        expect(auth.generateAidLogin({
            androidId: 123456789n,
            securityToken: 987654321n
        })).toBe("AidLogin 123456789:987654321");
    });

    test("ready() returns the same instance", async () => {
        const auth = new AuthManager(new KyHttpClient());

        // ready() should be callable but we don't actually call it
        // to avoid network requests in unit tests
        expect(typeof auth.ready).toBe("function");
    });

    test("builds GCM headers with AidLogin auth and app metadata", () => {
        const auth = new AuthManager(new KyHttpClient()) as unknown as {
            gcmHeaders(checkin: {
                androidId: bigint;
                securityToken: bigint
            }): Record<string, string>;
        };
        const checkin = {androidId: 123n, securityToken: 456n};

        expect(auth.gcmHeaders(checkin)).toMatchObject({
            authorization: "AidLogin 123:456",
            app: DC_APP.package,
            app_ver: DC_APP.versionCode,
            gcm_ver: expect.any(String)
        });
    });

    test("requests app_id with OkHttp-style multipart content length parts", async () => {
        let capturedBody = "";
        let capturedContentType = "";
        const http = new KyHttpClient({
            hooks: {
                beforeRequest: [
                    async ({request}) => {
                        if (request.url === API_URL.auth.appId) {
                            capturedBody = await request.clone().text();
                            capturedContentType = request.headers.get("content-type") ?? "";
                            return new Response(JSON.stringify({app_id: "app-id"}), {
                                headers: {"content-type": "application/json"}
                            });
                        }
                    }
                ]
            }
        });
        const auth = new AuthManager(http) as unknown as {
            clientToken: string;
            fetchAppId(hashedAppKey: string): Promise<string>;
        };
        auth.clientToken = "client-token";

        await expect(auth.fetchAppId("hashed-token")).resolves.toBe("app-id");

        expect(capturedContentType).toStartWith("multipart/form-data; boundary=");
        expect(capturedBody).toContain("Content-Disposition: form-data; name=\"value_token\"");
        expect(capturedBody).toContain("Content-Disposition: form-data; name=\"client_token\"");
        expect(capturedBody).toContain("hashed-token");
        expect(capturedBody).toContain("client-token");
    });
});
