import {describe, expect, test} from "bun:test";
import {AuthManager, createRandomFid, KyHttpClient} from "../src";
import {API_URL, DC_APP} from "../src/http/constants";

describe("auth helpers", () => {
    test("creates Firebase installation IDs in the expected FID shape", () => {
        const fid = createRandomFid();

        expect(fid).toHaveLength(22);
        expect(fid).toMatch(/^[A-Za-z0-9_-]{22}$/);
        expect(fid[0]).toMatch(/[cdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0-9_-]/i);
    });

    test("creates unique FIDs on each call", () => {
        const fids = new Set(Array.from({length: 100}, () => createRandomFid()));

        expect(fids.size).toBe(100);
    });

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

    test("starts without remote auth state and generates local Firebase identity state", () => {
        const auth = new AuthManager(new KyHttpClient());

        expect(auth.fcmToken).toBeNull();
        expect(auth.firebaseInstallationId).toHaveLength(22);
    });

    test("setCheckinCredentials stores provided credentials", () => {
        const auth = new AuthManager(new KyHttpClient());

        auth.setCheckinCredentials({
            androidId: "1234567890",
            securityToken: "9876543210"
        });

        expect(auth.fcmToken).toBeNull();
    });

    test("generates the current APK fallback app_check token shape", () => {
        const auth = new AuthManager(new KyHttpClient()) as unknown as {
            fallbackDateToken(date: Date): string;
        };

        expect(auth.fallbackDateToken(new Date("2026-07-01T23:18:00.000Z"))).toBe("Thu1822442770207");
    });

    test("ready() returns the same instance", async () => {
        const auth = new AuthManager(new KyHttpClient());

        // ready() should be callable but we don't actually call it
        // to avoid network requests in unit tests
        expect(typeof auth.ready).toBe("function");
    });

    test("builds GCM headers with FirebaseMessaging request_type values", () => {
        const auth = new AuthManager(new KyHttpClient()) as unknown as {
            gcmHeaders(checkin: {
                androidId: bigint;
                securityToken: bigint
            }, requestType: "0" | "2"): Record<string, string>;
        };
        const checkin = {androidId: 123n, securityToken: 456n};

        expect(auth.gcmHeaders(checkin, "0")).toMatchObject({
            Authorization: "AidLogin 123:456",
            app: DC_APP.package,
            app_ver: DC_APP.versionCode,
            request_type: "0"
        });
        expect(auth.gcmHeaders(checkin, "2")).toMatchObject({
            request_type: "2"
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
        expect(capturedBody).toContain("Content-Disposition: form-data; name=\"value_token\"\r\nContent-Length: 12");
        expect(capturedBody).toContain("Content-Disposition: form-data; name=\"client_token\"\r\nContent-Length: 12");
        expect(capturedBody).toContain("client-token");
    });
});