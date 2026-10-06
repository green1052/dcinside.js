import {describe, expect, test} from "bun:test";
import {anonymous, json, loggedIn, makeClient} from "./helpers";

describe("CommentApi", () => {
    test("list defaults to style=new and uses user_id (not confirm_id)", async () => {
        const {dc, requests} = makeClient(() => json([{comment_list: [], total_page: 1}]), loggedIn);
        await dc.comments.list("g", 1);
        await dc.comments.list("g", 1, {sort: "reply", page: 2});

        expect(requests[0]!.fields).toEqual({style: "new", id: "g", no: "1", re_page: "1", user_id: "myid", app_id: "APP"});
        expect(requests[1]!.fields).toMatchObject({csort: "reply", re_page: "2"});
        expect(requests[1]!.fields["style"]).toBeUndefined();
    });

    test("pages stops at total_page", async () => {
        const {dc, requests} = makeClient(() => json([{comment_list: [{comment_no: 1}], total_page: 2}]));
        const pages = [];
        for await (const page of dc.comments.pages("g", 1)) pages.push(page);
        expect(pages.length).toBe(2);
        expect(requests.length).toBe(2);
    });

    test("anonymous comment sends nick/pw and default best fields", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), anonymous);
        await dc.comments.write("g", 5, "안녕");
        expect(requests[0]!.url.pathname).toBe("/api/comment_ok.php");
        expect(requests[0]!.fields).toMatchObject({
            id: "g", no: "5", mode: "com_write", comment_memo: "안녕", comment_nick: "ㅇㅇ", comment_pw: "1234",
            best_chk: "N", best_comno: "0", use_gall_nickname: "0", use_bigdccon: "0", client_token: "fcm-token"
        });
    });

    test("reply sends the parent's user_id as reple_id like the app", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), loggedIn);
        await dc.comments.reply("g", 5, {comment_no: 42, user_id: "writer"}, "답글");
        expect(requests[0]!.fields).toMatchObject({mode: "com_reple", reple_id: "writer", comment_no: "42", user_id: "myid"});
    });

    test("two dccons are joined with indexed detail_idx", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), loggedIn);
        await dc.comments.write("g", 5, {dccons: [{tag: "<a>", detailIdx: 1}, {tag: "<b>", detailIdx: 2}]});
        expect(requests[0]!.fields).toMatchObject({comment_memo: "<a><b>", "detail_idx[0]": "1", "detail_idx[1]": "2"});
    });

    test("delete posts comment_del with password for anonymous", async () => {
        const {dc, requests} = makeClient(() => json({result: true}), anonymous);
        await dc.comments.delete("g", 5, 9);
        expect(requests[0]!.fields).toMatchObject({mode: "comment_del", comment_pw: "1234", comment_no: "9"});
    });
});
