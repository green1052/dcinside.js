import {describe, expect, test} from "bun:test";
import {ArticleManager} from "../src/modules/articles";
import {CommentManager} from "../src/modules/comments";
import {anonymousSession, json, mockAuth, mockHttp, unwrapHash} from "./helpers";

const listBody = (nos: number[]) => [{gall_info: {gall_title: "갤"}, gall_list: nos.map((no) => ({no}))}];
const refreshError = () => json([{result: false, cause: "만료", refresh_join: true}]);

describe("ArticleManager.listPages", () => {
    test("iterates pages until an empty gall_list page", async () => {
        const pages = [listBody([1, 2]), listBody([3]), listBody([])];
        const {auth} = mockAuth();
        const {http, requests} = mockHttp((_, index) => json(pages[index]));
        const manager = new ArticleManager(http, auth, () => anonymousSession);

        const results = [];
        for await (const page of manager.listPages({gallery: "g"})) results.push(page);

        expect(results.length).toBe(3);
        expect(results[0]!.gall_list.length).toBe(2);
        expect(requests.length).toBe(3);
        expect(unwrapHash(requests[0]!).searchParams.get("page")).toBe("1");
        expect(unwrapHash(requests[2]!).searchParams.get("page")).toBe("3");
    });

    test("refresh_join error re-requests the same page and continues iteration", async () => {
        const {auth, calls} = mockAuth();
        const {http, requests} = mockHttp((_, index) => {
            if (index <= 1) return refreshError();
            return json(index === 2 ? listBody([1]) : listBody([]));
        });
        const manager = new ArticleManager(http, auth, () => anonymousSession);

        const results = [];
        for await (const page of manager.listPages({gallery: "g"})) results.push(page);

        expect(calls.refreshAppId).toBe(1);
        expect(results.length).toBe(2);
        expect(requests.length).toBe(4);
        expect(unwrapHash(requests[0]!).searchParams.get("page")).toBe("1");
        expect(unwrapHash(requests[1]!).searchParams.get("page")).toBe("1");
        expect(unwrapHash(requests[2]!).searchParams.get("page")).toBe("1");
        expect(unwrapHash(requests[3]!).searchParams.get("page")).toBe("2");
    });

    test("honors start page option", async () => {
        const {auth} = mockAuth();
        const {http, requests} = mockHttp(() => json(listBody([])));
        const manager = new ArticleManager(http, auth, () => anonymousSession);

        for await (const _ of manager.listPages({gallery: "g", page: 4})) break;

        expect(unwrapHash(requests[0]!).searchParams.get("page")).toBe("4");
    });
});

describe("CommentManager.listPages", () => {
    const commentBody = (commentNos: number[], totalPage: number) => [{
        total_comment: commentNos.length,
        total_page: totalPage,
        re_page: 1,
        comment_list: commentNos.map((comment_no) => ({comment_no}))
    }];

    test("stops after total_page", async () => {
        const {auth} = mockAuth();
        const {http, requests} = mockHttp((_, index) => json(commentBody([index + 1], 2)));
        const manager = new CommentManager(http, auth, () => anonymousSession);

        const results = [];
        for await (const page of manager.listPages({gallery: "g", articleId: 1})) results.push(page);

        expect(results.length).toBe(2);
        expect(requests.length).toBe(2);
    });

    test("refresh_join error re-requests the same page and continues iteration", async () => {
        const {auth, calls} = mockAuth();
        const {http, requests} = mockHttp((_, index) => {
            if (index <= 1) return refreshError();
            return json(commentBody([index], 2));
        });
        const manager = new CommentManager(http, auth, () => anonymousSession);

        const results = [];
        for await (const page of manager.listPages({gallery: "g", articleId: 1})) results.push(page);

        expect(calls.refreshAppId).toBe(1);
        expect(results.length).toBe(2);
        expect(requests.length).toBe(4);
        expect(unwrapHash(requests[2]!).searchParams.get("re_page")).toBe("1");
        expect(unwrapHash(requests[3]!).searchParams.get("re_page")).toBe("2");
    });
});
