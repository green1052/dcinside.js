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
        const session = client.useAnonymous("nick", "id");

        expect(client.session).toBe(session);
        expect(client.currentUser).toEqual({
            type: "anonymous",
            id: "id",
            password: "pw"
        });
    });
});