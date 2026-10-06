import {describe, expect, test} from "bun:test";
import {captchaUrl, SessionRequiredError} from "../src";
import {json, loggedIn, makeClient} from "./helpers";

describe("ManagementApi", () => {
    test("management paths strip the mi$/pr$ prefix and pick the gallery kind", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), loggedIn);
        await dc.management.blockImage("mi$abc", 1, {rel1: "r1", rel2: "r2", imgSrc: "s", subject: "t"});
        await dc.management.clearImageBlock("programming", {rel1: "a", rel2: "b"});
        expect(requests.map((r) => r.url.pathname)).toEqual(["/management/mini/blockImg/abc", "/management/minor/blockImgClear/programming"]);
    });

    test("manager requests carry user_id and mode", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), loggedIn);
        await dc.management.reorderNotices("g", 1, [5, 4]);
        expect(requests[0]!.fields).toMatchObject({mode: "change_noti", user_id: "myid", "o_no[0]": "5", "o_no[1]": "4"});
    });

    test("settingsUrl uses the mobile management page", async () => {
        const {dc} = makeClient(() => json({}), loggedIn);
        expect(await dc.management.settingsUrl("pr$x")).toStartWith("https://m.dcinside.com/management/person/main/x?app_id=APP&confirm_id=myid");
    });

    test("requires login", async () => {
        const {dc} = makeClient(() => json({}));
        expect(() => dc.management.bump("g", 1)).toThrow(SessionRequiredError);
    });
});

describe("GalleryApi", () => {
    test("rankings read JSONP lists from json1", async () => {
        const {dc, requests} = makeClient(() => new Response("([{\"id\":\"a\"}])"));
        expect(await dc.galleries.ranking("minor")).toEqual([{id: "a"}]);
        expect(requests[0]!.url.toString()).toBe("https://json2.dcinside.com/json1/mgallmain/mgallery_ranking.php");
        expect(requests[0]!.fields).toEqual({});
    });

    test("info switches between minor_info and gall_info", async () => {
        const {dc, requests} = makeClient(() => json({result: true}));
        await dc.galleries.info("m");
        await dc.galleries.info("g", {main: true});
        expect(requests.map((r) => r.url.pathname)).toEqual(["/api/minor_info", "/api/gall_info"]);
    });
});

describe("DCConApi / UserApi / SearchApi", () => {
    test("dccon.php types match the app enum", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), loggedIn);
        await dc.dccons.detail(3);
        await dc.dccons.insert({package_idx: 3, detail_idx: 4});
        expect(requests.map((r) => r.fields["type"])).toEqual(["package_detail", "insert"]);
        expect(requests[1]!.fields).toMatchObject({package_idx: "3", detail_idx: "4", user_id: "myid"});
    });

    test("confirmMiniJoin sends the join answer", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), loggedIn);
        await dc.user.confirmMiniJoin("mi$x", "답");
        expect(requests[0]!.fields).toMatchObject({id: "mi$x", question_memo: "답", user_id: "myid"});
    });

    test("search uses _total_search_new.php with search_type", async () => {
        const {dc, requests} = makeClient(() => json({result: true, gall_list: []}));
        await dc.search.search("bun", {type: "gall_name", page: 2});
        expect(requests[0]!.url.pathname).toBe("/api/_total_search_new.php");
        expect(requests[0]!.fields).toMatchObject({keyword: "bun", search_type: "gall_name", page: "2"});
    });
});

test("captchaUrl matches the app's captcha endpoints", () => {
    expect(captchaUrl("comment", "k", "g")).toBe("https://app.dcinside.com/code_reple.php?type=C&id=g&dccode=k");
    expect(captchaUrl("article", "k", "g")).toBe("https://app.dcinside.com/code.php?id=g&dccode=k");
    expect(captchaUrl("login", "k")).toBe("https://app.dcinside.com/captcha/code?id=login_botchk&type=L&dccode=k");
});
