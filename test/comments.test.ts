import {describe, expect, test} from "bun:test";
import {CaptchaRequiredError} from "../src/core/http/errors";
import {CommentManager} from "../src/modules/comments";
import {anonymousSession, json, loginSession, mockAuth, mockHttp, unwrapHash} from "./helpers";

function makeManager(respond: (request: Request, index: number) => Response | Promise<Response>, session = anonymousSession) {
    const {auth, calls} = mockAuth();
    const {http, requests} = mockHttp(respond);
    return {manager: new CommentManager(http, auth, () => session), calls, requests};
}

const commentBody = (commentNos: number[], totalPage = 1) => [{
    total_comment: commentNos.length,
    total_page: totalPage,
    re_page: 1,
    comment_list: commentNos.map((comment_no) => ({comment_no, comment_memo: "m", name: "n"}))
}];

describe("CommentManager.list", () => {
    test("builds read URL with id, no and re_page", async () => {
        const {manager, requests} = makeManager(() => json(commentBody([1])));
        await manager.list({gallery: "g", articleId: 3, page: 2});

        const url = unwrapHash(requests[0]!);
        expect(url.pathname).toContain("comment_new.php");
        expect(url.searchParams.get("id")).toBe("g");
        expect(url.searchParams.get("no")).toBe("3");
        expect(url.searchParams.get("re_page")).toBe("2");
    });

    test("refreshes app_id once and retries on refresh_join error", async () => {
        const {manager, calls, requests} = makeManager((_, index) =>
            index === 0 ? json([{result: false, cause: "만료", refresh_join: true}]) : json(commentBody([1]))
        );
        const result = await manager.list({gallery: "g", articleId: 1});

        expect(result.comment_list.length).toBe(1);
        expect(calls.refreshAppId).toBe(1);
        expect(requests.length).toBe(2);
    });
});

describe("CommentManager.write", () => {
    test("anonymous text comment sends nick, password and memo", async () => {
        const {manager, requests} = makeManager(() => json({result: true, data: 1, cause: null, word: null}));
        await manager.write({gallery: "g", articleId: 1, content: "댓글"});

        const form = await requests[0]!.formData();
        expect(form.get("mode")).toBe("com_write");
        expect(form.get("comment_memo")).toBe("댓글");
        expect(form.get("comment_nick")).toBe("nick");
        expect(form.get("comment_pw")).toBe("pw");
        expect(form.get("app_id")).toBe("app-id");
        expect(form.get("client_token")).toBe("fcm-token");
    });

    test("login comment sends board_id and user_id", async () => {
        const {manager, requests} = makeManager(() => json({result: true, data: 1, cause: null, word: null}), loginSession);
        await manager.write({gallery: "g", articleId: 1, content: "hi"});

        const form = await requests[0]!.formData();
        expect(form.get("board_id")).toBe("user-id");
        expect(form.get("user_id")).toBe("confirm-user");
        expect(form.has("comment_nick")).toBe(false);
    });

    test("dccon comment builds img tag and deduped detail_idx", async () => {
        const {manager, requests} = makeManager(() => json({result: true, data: 1, cause: null, word: null}));
        await manager.write({
            gallery: "g",
            articleId: 1,
            content: {
                type: "dccon",
                dccon: {detailIndex: 5, detailIndices: [5, 5, 7], imgLink: "https://img.png", memo: "콘"}
            }
        });

        const form = await requests[0]!.formData();
        expect(form.get("comment_memo")).toBe(`<img src='https://img.png' class='written_dccon' alt='0' conalt='0' title='콘'>`);
        expect(form.getAll("detail_idx")).toEqual(["5", "7"]);
    });

    test("reply sends comment_no of parent comment", async () => {
        const {manager, requests} = makeManager(() => json({result: true, data: 2, cause: null, word: null}));
        await manager.reply({gallery: "g", articleId: 1, content: "대댓글", replyToCommentId: 11});

        const form = await requests[0]!.formData();
        expect(form.get("mode")).toBe("com_reple");
        expect(form.get("comment_no")).toBe("11");
    });

    test("captcha cause throws CaptchaRequiredError with writeComment action", async () => {
        const {manager} = makeManager(() => json([{result: false, cause: "보안코드 입력", captcha: "cap9"}]));
        try {
            await manager.write({gallery: "g", articleId: 1, content: "x"});
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(CaptchaRequiredError);
            expect((error as CaptchaRequiredError).action).toBe("writeComment");
            expect((error as CaptchaRequiredError).challenge.captcha).toBe("cap9");
        }
    });

    test("requires a session", async () => {
        const {auth} = mockAuth();
        const {http} = mockHttp(() => json({result: true}));
        const manager = new CommentManager(http, auth, () => null);
        await expect(manager.write({gallery: "g", articleId: 1, content: "x"})).rejects.toThrow("session is required");
    });
});

describe("CommentManager.delete", () => {
    test("login delete sends board_id and user_id", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: null}), loginSession);
        await manager.delete({gallery: "g", articleId: 1, commentId: 7});

        const form = await requests[0]!.formData();
        expect(form.get("mode")).toBe("comment_del");
        expect(form.get("comment_no")).toBe("7");
        expect(form.get("board_id")).toBe("user-id");
        expect(form.get("user_id")).toBe("confirm-user");
    });

    test("anonymous delete sends comment_pw", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: null}));
        await manager.delete({gallery: "g", articleId: 1, commentId: 7});

        const form = await requests[0]!.formData();
        expect(form.get("comment_pw")).toBe("pw");
    });
});

describe("scoped manager", () => {
    test("article scope fills gallery and articleId", async () => {
        const {manager, requests} = makeManager(() => json(commentBody([1])));
        await manager.article("mi$g", 5).list();

        const url = unwrapHash(requests[0]!);
        expect(url.searchParams.get("id")).toBe("mi$g");
        expect(url.searchParams.get("no")).toBe("5");
    });
});
