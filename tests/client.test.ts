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
});