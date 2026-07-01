import {describe, expect, test} from "bun:test";
import {AuthManager, createRandomFid, KyHttpClient} from "../src";

describe("auth helpers", () => {
    test("creates Firebase installation IDs in the expected FID shape", () => {
        const fid = createRandomFid();

        expect(fid).toHaveLength(22);
        expect(fid).toMatch(/^[A-Za-z0-9_-]{22}$/);
        expect(fid[0]).toMatch(/[cdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0-9_-]/i);
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
});