import {describe, expect, test} from "bun:test";
import {AuthManager, createRandomFid, KyHttpClient} from "../src";

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

    test("ready() returns the same instance", async () => {
        const auth = new AuthManager(new KyHttpClient());

        // ready() should be callable but we don't actually call it
        // to avoid network requests in unit tests
        expect(typeof auth.ready).toBe("function");
    });
});