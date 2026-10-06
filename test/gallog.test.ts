import {describe, expect, test} from "bun:test";
import {APP} from "../src";
import {json, loggedIn, makeClient} from "./helpers";

const html = (body: string) => new Response(`<!DOCTYPE html><html><body>${body}</body></html>`, {headers: {"content-type": "text/html"}});

/** 실제 m.dcinside.com 갤로그 마크업을 줄인 가짜 데이터입니다. */
const POSTS = `
<span class="tit">테스터의 갤로그</span>
<ul class="tab-lst">
<li class=on><a href="x?menu=G_all"> <span class="tab-txt">전체</span><span class="ct" id="total_cnt1">1,203</span> </a></li>
<li><a href="x?menu=G"> <span class="tab-txt">갤러리</span><span class="ct" id="total_cnt2">1,200</span> </a></li>
<li><a href="x?menu=E"> <span class="tab-txt">마이너갤</span><span class="ct" id="total_cnt3">3</span> </a></li>
<li><a href="x?menu=N"> <span class="tab-txt">미니갤</span><span class="ct" id="total_cnt4">0</span> </a></li>
<li><a href="x?menu=P"> <span class="tab-txt">인물갤</span><span class="ct">0</span> </a></li>
</ul>
<ul class="gall-detail-lst ">
<li class="" gall_code="733" gall_no="100" gall_type="G"><!--갤로그개선-->
<div class="gall-detail-lnktb "><a href="javascript:;" class="lt">
<span class="fxoline"><span class="fxo-txt">
제목 &amp; 하나
</span><span class="num">[2]</span><span class="badge">(펌)</span></span>
<ul class="ginfo"><li>프로그래밍
</li><li>2026.10.06</li></ul>
<!--div class="namedate"><span class="name">프로그래밍</span><span class="date">2026.10.06 12:32</span></div><!-- //.namedate -->
</a></div><!-- //.gallog-lnktb -->
</li>
</ul>
<div class="paging"><a href="https://m.dcinside.com/gallog/tester?menu=G_all&amp;page=1">1</a><a href="https://m.dcinside.com/gallog/tester?menu=G_all&amp;page=2">2</a></div>`;

const COMMENTS = `
<ul class="gall-detail-lst pd">
<li class="add-comment" gall_code="9" gall_no="7" gall_type="I"><!--갤로그개선-->
<div class="gall-detail-lnktb "><a href="javascript:;" class="lt">
<span class="fxoline"><span class="fxo-txt"><span class="txt">댓글<br>두 줄</span></span></span>
<ul class="ginfo"><li>미니갤
</li><li>2026-10-01</li></ul>
<div class="original "><span class="original-tit">
원글 제목
</span></div>
</a></div><!-- //.gallog-lnktb -->
</li>
</ul>`;

const GUESTBOOK = `
<ul class="all-comment-lst">
<li class="comment" secret="1">
<a href="https://m.dcinside.com/gallog/friend " class="nick">친구<img src='x.png'></a>
<p class="txt">안녕</p>
<span class="date">2026.10.01 11:30:52</span>
</li>
</ul>`;

describe("GallogApi", () => {
    test("parses post list, counts and next page with the WebView user agent", async () => {
        const {dc, requests} = makeClient(() => html(POSTS));
        const result = await dc.gallog.posts("tester");

        expect(requests[0]!.url.toString()).toBe("https://m.dcinside.com/gallog/tester?menu=G_all&page=1");
        expect(requests[0]!.raw.headers.get("user-agent")).toBe(APP.webViewUserAgent);
        expect(result.counts).toEqual({all: 1203, board: 1200, minor: 3, mini: 0, person: 0});
        expect(result.nextPage).toBe(2);
        expect(result.public).toBe(true);
        expect(result.items).toEqual([{
            gallCode: "733", no: 100, gallType: "G", text: "제목 & 하나", galleryName: "프로그래밍",
            date: "2026.10.06 12:32", commentCount: 2, badge: "(펌)"
        }]);
    });

    test("comments use R-menus and keep the original title", async () => {
        const {dc, requests} = makeClient(() => html(COMMENTS));
        const result = await dc.gallog.comments("tester", {category: "mini", page: 3});

        expect(requests[0]!.fields).toEqual({menu: "I", page: "3"});
        expect(result.nextPage).toBeNull();
        expect(result.items[0]).toMatchObject({text: "댓글\n두 줄", originalTitle: "원글 제목", date: "2026-10-01"});
    });

    test("logged-in requests add app_id/confirm_id like the app", async () => {
        const {dc, requests} = makeClient(() => html(POSTS), loggedIn);
        await dc.gallog.posts("tester", {category: "minor"});
        expect(requests[0]!.fields).toEqual({menu: "E", page: "1", confirm_id: "myid", app_id: "APP"});
    });

    test("guestbook entries", async () => {
        const {dc} = makeClient(() => html(GUESTBOOK));
        expect(await dc.gallog.guestbook("tester")).toEqual([
            {nickname: "친구", userId: "friend", text: "안녕", date: "2026.10.01 11:30:52", secret: true}
        ]);
    });

    test("resolveGallery adds mi$/pr$ prefixes from gall_type", async () => {
        const {dc, requests} = makeClient(() => json({gall_id: "abc"}));
        expect(await dc.gallog.resolveGallery({gallCode: "9", gallType: "I"})).toBe("mi$abc");
        expect(await dc.gallog.resolveGallery({gallCode: "9", gallType: "P"})).toBe("pr$abc");
        expect(await dc.gallog.resolveGallery({gallCode: "9", gallType: "G"})).toBe("abc");
        expect(requests[0]!.url.toString()).toBe("https://m.dcinside.com/gallog/list-direct");
        expect(requests[0]!.fields).toEqual({gall_code: "9", gall_type: "I"});
    });

    test("url matches the app's WebView link", async () => {
        const {dc} = makeClient(() => json({}), loggedIn);
        expect(await dc.gallog.url("tester")).toBe("https://m.dcinside.com/gallog/tester?app_id=APP&confirm_id=myid");
    });
});
