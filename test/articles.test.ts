import {describe, expect, test} from "bun:test";
import {CaptchaRequiredError, SessionRequiredError} from "../src";
import {anonymous, json, loggedIn, makeClient} from "./helpers";

describe("ArticleApi", () => {
    test("list sends app params through redirect.php", async () => {
        const {dc, requests} = makeClient(() => json([{gall_info: [{gall_title: "t"}], gall_list: []}]), loggedIn);
        const result = await dc.articles.list({gallery: "programming", page: 2, search: {keyword: "bun"}, filter: "recommend", headId: 3});

        expect(result.gall_info?.[0]?.gall_title).toBe("t");
        expect(new URL(requests[0]!.raw.url).pathname).toBe("/api/redirect.php");
        expect(requests[0]!.url.pathname).toBe("/api/gall_list_new.php");
        expect(requests[0]!.fields).toEqual({
            id: "programming", page: "2", s_type: "subject_m", serVal: "bun", confirm_id: "myid", headid: "3", recommend: "1", app_id: "APP"
        });
    });

    test("pages stops at an empty page", async () => {
        const {dc, requests} = makeClient((_, i) => json([{gall_list: i < 2 ? [{no: i}] : []}]));
        const pages = [];
        for await (const page of dc.articles.pages({gallery: "g"})) pages.push(page);
        expect(pages.length).toBe(2);
        expect(requests.map((r) => r.fields["page"])).toEqual(["1", "2", "3"]);
    });

    test("read passes client_id and permission password", async () => {
        const {dc, requests} = makeClient(() => json([{view_info: {subject: "s"}, view_main: {memo: "m"}}]));
        const view = await dc.articles.read("g", 10, {password: "pw"});
        expect(view.view_info?.subject).toBe("s");
        expect(requests[0]!.fields).toMatchObject({id: "g", no: "10", permission_pw: "pw", client_id: "fcm-token"});
    });

    test("write encodes like the app: subject/name URL-encoded, password raw", async () => {
        const {dc, requests} = makeClient(() => json({result: true, cause: "123"}), anonymous);
        const image = new File(["x"], "a.png", {type: "image/png"});
        await dc.articles.write({
            gallery: "g",
            subject: "제목 테스트",
            content: ["첫 줄\n둘째  줄", {type: "image", file: image}, {type: "dccon", tag: "<img src='x'>", detailIdx: 5, packageIdx: 9}]
        });

        const {url, fields, files} = requests[0]!;
        expect(url.toString()).toBe("https://upload.dcinside.com/_app_write_api.php");
        expect(fields["mode"]).toBe("write");
        expect(fields["subject"]).toBe("%EC%A0%9C%EB%AA%A9+%ED%85%8C%EC%8A%A4%ED%8A%B8");
        expect(fields["name"]).toBe("%E3%85%87%E3%85%87");
        expect(fields["password"]).toBe("1234");
        expect(decodeURIComponent(fields["memo_block[0]"]!.replace(/\+/g, " "))).toBe("<div>첫 줄<br>둘째 &nbsp;줄</div>");
        expect(fields["memo_block[1]"]).toBe("Dc_App_Img_0");
        expect(files["upload[0]"]?.name).toBe("a.png");
        expect(fields["detail_idx[2]"]).toBe("9|dccon|5");
        expect(fields["write_movie"]).toBe("0");
        expect(fields["client_token"]).toBe("fcm-token");
    });

    test("write with articleNo switches to modify mode", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), loggedIn);
        await dc.articles.write({gallery: "g", subject: "s", content: ["c"], articleNo: 7});
        expect(requests[0]!.fields).toMatchObject({mode: "modify", no: "7", user_id: "myid"});
        expect(requests[0]!.fields["write_movie"]).toBeUndefined();
    });

    test("delete uses mode board_del2 and write_pw for anonymous", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), anonymous);
        await dc.articles.delete("g", 1);
        expect(requests[0]!.fields).toMatchObject({mode: "board_del2", write_pw: "1234", id: "g", no: "1"});
    });

    test("write without a session throws", async () => {
        const {dc} = makeClient(() => json({}));
        await expect(dc.articles.write({gallery: "g", subject: "s", content: []})).rejects.toBeInstanceOf(SessionRequiredError);
    });

    test("upvote surfaces captcha requirement and sends the answer", async () => {
        const {dc, requests} = makeClient((_, i) => json(i === 0 ? {result: false, cause: "자동입력 방지코드가 필요합니다"} : {result: true}));
        await expect(dc.articles.upvote("g", 1)).rejects.toBeInstanceOf(CaptchaRequiredError);
        await dc.articles.upvote("g", 1, {key: "k", code: "abcd"});
        expect(requests[1]!.url.pathname).toBe("/api/_recommend_up.php");
        expect(requests[1]!.fields).toMatchObject({rand_code: "k", captcha_code: "abcd"});
    });

    test("reportUrl points at the mobile report page", async () => {
        const {dc} = makeClient(() => json({}), loggedIn);
        const url = new URL(await dc.articles.reportUrl("g", 3));
        expect(url.origin + url.pathname).toBe("https://m.dcinside.com/api/report.php");
        expect(Object.fromEntries(url.searchParams)).toEqual({app_id: "APP", id: "g", no: "3", confirm_id: "myid"});
    });
});
