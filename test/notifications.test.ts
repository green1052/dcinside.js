import {describe, expect, test} from "bun:test";
import {json, loggedIn, makeClient} from "./helpers";

describe("NotificationApi", () => {
    test("subscription lists are GETs (POST to the same path registers)", async () => {
        const {dc, requests} = makeClient(() => json({lists: []}));
        await dc.notifications.users("g");
        await dc.notifications.recommends();

        expect(requests.map((r) => [r.method, r.url.pathname])).toEqual([["GET", "/api/alarm/user"], ["GET", "/api/alarm/recomm"]]);
        expect(requests[0]!.fields).toEqual({client_id: "fcm-token", id: "g", app_id: "APP"});
    });

    test("messages pages through api/alarm/message", async () => {
        const {dc, requests} = makeClient((_, i) => json({lists: i === 0 ? [{idx: "1"}] : []}));
        const pages = [];
        for await (const page of dc.notifications.messagePages("U")) pages.push(page);
        expect(pages.length).toBe(1);
        expect(requests.map((r) => r.fields["page"])).toEqual(["1", "2"]);
        expect(requests[0]!.fields["type"]).toBe("U");
    });

    test("subscribe/unsubscribe hit separate endpoints", async () => {
        const {dc, requests} = makeClient(() => json({result: true}));
        await dc.notifications.subscribeKeyword("g", "키워드");
        await dc.notifications.unsubscribeArticle("g", 3);
        expect(requests.map((r) => r.url.pathname)).toEqual(["/api/alarm/keyword", "/api/alarm/del_article"]);
        expect(requests[1]!.fields).toMatchObject({article_type: "A", type: "U", no: "3"});
    });

    test("deleteMessages sends indexed ids", async () => {
        const {dc, requests} = makeClient(() => json({result: true}));
        await dc.notifications.deleteMessages(["a", "b"]);
        expect(requests[0]!.fields).toMatchObject({"del_message[0]": "a", "del_message[1]": "b"});
    });

    test("minorNotification requires login and posts to /alarm", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), loggedIn);
        await dc.notifications.minorNotification("g");
        expect(requests[0]!.url.toString()).toBe("https://app.dcinside.com/alarm/minor-notification");
    });
});
