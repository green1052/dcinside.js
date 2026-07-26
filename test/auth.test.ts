import {describe, expect, test} from "bun:test";
import {AuthManager} from "../src/core/auth";
import {KyHttpClient} from "../src/core/http";
import {requireLoginSession, requireSession} from "../src/core/session";
import type {DeviceCredentials, Session} from "../src/core/types";

function makeCredentials(): DeviceCredentials {
    return {
        androidId: "123456789",
        securityToken: "987654321",
        fid: "test-fid",
        refreshToken: "test-refresh",
        clientToken: "test-client-token",
        appId: "test-app-id",
        appIdIssuedAt: Date.now(),
        appCheckDate: "20260726",
        lastAppCheckTime: Date.now()
    };
}

describe("AuthManager credentials", () => {
    test("import/export roundtrip preserves credentials", () => {
        const auth = new AuthManager(new KyHttpClient());
        expect(auth.exportCredentials()).toBeNull();

        const creds = makeCredentials();
        auth.importCredentials(creds);

        expect(auth.exportCredentials()).toEqual(creds);
        expect(auth.fcmToken).toBe("test-client-token");
        expect(auth.firebaseInstallationId).toBe("test-fid");
        expect(auth.firebaseRefreshToken).toBe("test-refresh");
    });

    test("getAppId reuses imported app_id within TTL without network", async () => {
        const auth = new AuthManager(new KyHttpClient({
            fetch: (async () => {
                throw new Error("network must not be touched");
            }) as unknown as typeof fetch
        }));
        auth.importCredentials(makeCredentials());
        expect(await auth.getAppId()).toBe("test-app-id");
    });

    test("fetchClientToken returns cached token without network", async () => {
        const auth = new AuthManager(new KyHttpClient());
        auth.importCredentials(makeCredentials());
        expect(await auth.fetchClientToken()).toBe("test-client-token");
    });

    test("generateAidLogin formats checkin credentials", () => {
        const auth = new AuthManager(new KyHttpClient());
        expect(auth.generateAidLogin({androidId: 1n, securityToken: 2n})).toBe("AidLogin 1:2");
    });

    test("createAnonymousSession builds a local session", () => {
        const auth = new AuthManager(new KyHttpClient());
        expect(auth.createAnonymousSession("nick", "pw")).toEqual({
            user: {type: "anonymous", id: "nick", password: "pw"},
            detail: null
        });
    });
});

describe("session guards", () => {
    const anonymous: Session = {user: {type: "anonymous", id: "nick", password: "pw"}, detail: null};

    test("requireSession throws without a session", () => {
        expect(() => requireSession(() => null, "write articles")).toThrow("A session is required to write articles");
        expect(requireSession(() => anonymous, "write articles")).toBe(anonymous);
    });

    test("requireLoginSession rejects anonymous sessions", () => {
        expect(() => requireLoginSession(() => null)).toThrow("logged-in session is required");
        expect(() => requireLoginSession(() => anonymous, "buy DCCons")).toThrow("buy DCCons");
    });
});
