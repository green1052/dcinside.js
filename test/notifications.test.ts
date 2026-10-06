import {describe, expect, test} from "bun:test";
import {NotificationManager} from "../src/modules/notifications";
import {json, mockAuth, mockHttp} from "./helpers";

function makeManager(respond: (request: Request, index: number) => Response | Promise<Response>) {
    const {auth} = mockAuth();
    const {http, requests} = mockHttp(respond);
    return {manager: new NotificationManager(http, auth), requests};
}

const formOf = async (request: Request) => request.formData();

describe("NotificationManager", () => {
    test("toggleArticle enable posts article fields", async () => {
        const {manager, requests} = makeManager(() => json({result: true}));
        await manager.toggleArticle({
            galleryId: "g",
            postNo: 1,
            enable: true,
            galleryName: "갤러리",
            nickname: "닉",
            subject: "제목",
            writeTime: "2026-01-01"
        });

        expect(new URL(requests[0]!.url).pathname).toContain("/api/alarm/article");
        const form = await formOf(requests[0]!);
        expect(form.get("client_id")).toBe("fcm-token");
        expect(form.get("id")).toBe("g");
        expect(form.get("no")).toBe("1");
        expect(form.get("ko_name")).toBe("갤러리");
        expect(form.get("nickname")).toBe("닉");
        expect(form.get("subject")).toBe("제목");
        expect(form.get("write_time")).toBe("2026-01-01");
    });

    test("toggleArticle disable posts unregister fields to del_article", async () => {
        const {manager, requests} = makeManager(() => json({result: true}));
        await manager.toggleArticle({galleryId: "g", postNo: 1, enable: false});

        expect(new URL(requests[0]!.url).pathname).toContain("/api/alarm/del_article");
        const form = await formOf(requests[0]!);
        expect(form.get("article_type")).toBe("A");
        expect(form.get("type")).toBe("U");
        expect(form.has("subject")).toBe(false);
    });

    test("toggleKeyword routes enable/disable to separate endpoints", async () => {
        const {manager, requests} = makeManager(() => json({result: true}));
        await manager.toggleKeyword({galleryId: "g", keyword: "키워드", enable: true});
        await manager.toggleKeyword({galleryId: "g", keyword: "키워드", enable: false});

        expect(new URL(requests[0]!.url).pathname).toContain("/api/alarm/keyword");
        expect(new URL(requests[0]!.url).pathname).not.toContain("del");
        expect(new URL(requests[1]!.url).pathname).toContain("/api/alarm/del_keyword");
        expect(await (await formOf(requests[0]!)).get("keyword")).toBe("키워드");
    });

    test("listAlarms posts client_token and page", async () => {
        const {manager, requests} = makeManager(() => json({data: []}));
        await manager.listAlarms({page: 2});

        const form = await formOf(requests[0]!);
        expect(form.get("client_token")).toBe("fcm-token");
        expect(form.get("page")).toBe("2");
    });

    test("listUserSubscriptions GETs with gallery filter (POST would register)", async () => {
        const {manager, requests} = makeManager(() => json({data: []}));
        await manager.listUserSubscriptions({galleryId: "g"});

        expect(requests[0]!.method).toBe("GET");
        const url = new URL(requests[0]!.url);
        expect(url.pathname).toBe("/api/alarm/user");
        expect(url.searchParams.get("client_id")).toBe("fcm-token");
        expect(url.searchParams.get("id")).toBe("g");
    });

    test("listRecommendNotifications GETs without extra params", async () => {
        const {manager, requests} = makeManager(() => json({data: []}));
        await manager.listRecommendNotifications();

        expect(requests[0]!.method).toBe("GET");
        const url = new URL(requests[0]!.url);
        expect(url.pathname).toBe("/api/alarm/recomm");
        expect([...url.searchParams.keys()]).toEqual(["client_id"]);
    });

    test("listAlarmsPages iterates until an empty data page", async () => {
        const {manager, requests} = makeManager((_, index) =>
            json({data: index === 0 ? [{no: 1}, {no: 2}] : []})
        );

        const results = [];
        for await (const page of manager.listAlarmsPages()) results.push(page);

        expect(results.length).toBe(1);
        expect(results[0]!.data.length).toBe(2);
        expect(requests.length).toBe(2);
        expect(await (await formOf(requests[1]!)).get("page")).toBe("2");
    });
});
