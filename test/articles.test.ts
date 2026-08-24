import {describe, expect, test} from "bun:test";
import {CaptchaRequiredError, DCInsideError} from "../src/core/http/errors";
import {ArticleManager} from "../src/modules/articles";
import {anonymousSession, json, loginSession, mockAuth, mockHttp, unwrapHash} from "./helpers";

function makeManager(respond: (request: Request, index: number) => Response | Promise<Response>, session = anonymousSession) {
    const {auth, calls} = mockAuth();
    const {http, requests} = mockHttp(respond);
    return {manager: new ArticleManager(http, auth, () => session), auth, calls, http, requests};
}

const listBody = (nos: number[]) => [{gall_info: {gall_title: "갤러리"}, gall_list: nos.map((no) => ({no, subject: `s${no}`}))}];

describe("ArticleManager.list", () => {
    test("builds list URL with gallery, page and filters", async () => {
        const {manager, requests} = makeManager(() => json(listBody([1])));
        await manager.list({gallery: "mi$game", page: 3, recommend: true, headId: 5});

        const url = unwrapHash(requests[0]!);
        expect(url.searchParams.get("id")).toBe("mi$game");
        expect(url.searchParams.get("page")).toBe("3");
        expect(url.searchParams.get("recommend")).toBe("1");
        expect(url.searchParams.get("headid")).toBe("5");
    });

    test("sets search params when searchKeyword given", async () => {
        const {manager, requests} = makeManager(() => json(listBody([])));
        await manager.list({gallery: "g", searchKeyword: "키워드", searchType: "subject"});
        const url = unwrapHash(requests[0]!);
        expect(url.searchParams.get("s_type")).toBe("subject");
        expect(url.searchParams.get("serVal")).toBe("키워드");
    });

    test("refreshes app_id once and retries on refresh_join error", async () => {
        const {manager, calls, requests} = makeManager((_, index) =>
            index === 0 ? json([{result: false, cause: "만료", refresh_join: true}]) : json(listBody([1]))
        );
        const result = await manager.list({gallery: "g"});

        expect(result.gall_list.length).toBe(1);
        expect(calls.refreshAppId).toBe(1);
        expect(requests.length).toBe(2);
    });

    test("throws DCInsideError when refresh fails twice", async () => {
        const {manager, calls} = makeManager(() => json([{result: false, cause: "만료", refresh_join: true}]));
        await expect(manager.list({gallery: "g"})).rejects.toBeInstanceOf(DCInsideError);
        expect(calls.refreshAppId).toBe(1);
    });

    test("throws DCInsideError on other api error without retry", async () => {
        const {manager, calls, requests} = makeManager(() => json([{result: false, cause: "없는 갤러리"}]));
        await expect(manager.list({gallery: "g"})).rejects.toThrow("없는 갤러리");
        expect(calls.refreshAppId).toBe(0);
        expect(requests.length).toBe(1);
    });
});

describe("ArticleManager.read", () => {
    test("builds read URL and retries once on refresh_join error", async () => {
        const {manager, calls, requests} = makeManager((_, index) =>
            index === 0
                ? json([{result: false, cause: "만료", refresh_join: true}])
                : json([{view_info: {no: 7}, view_main: {memo: "본문"}}])
        );
        const result = await manager.read({gallery: "g", articleId: 7});

        expect(result.view_info.no).toBe(7);
        expect(calls.refreshAppId).toBe(1);
        const url = unwrapHash(requests[0]!);
        expect(url.searchParams.get("no")).toBe("7");
    });
});

describe("ArticleManager.write", () => {
    test("encodes text memo blocks and anonymous credentials", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: "123", id: "g"}));
        await manager.write({
            gallery: "g",
            subject: "a b",
            content: [{type: "text", text: "hello world\ngoodbye"}]
        });

        const form = await requests[0]!.formData();
        expect(form.get("subject")).toBe("a+b");
        expect(form.get("memo_block[0]")).toBe("%3Cdiv%3Ehello+world%3Cbr%3Egoodbye%3C%2Fdiv%3E");
        expect(form.get("name")).toBe("nick");
        expect(form.get("password")).toBe("pw");
        expect(form.get("mode")).toBe("write");
    });

    test("html block keeps raw html and restores newlines", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: "1", id: "g"}));
        await manager.write({gallery: "g", subject: "s", content: [{type: "html", html: "<div>x\ny</div>"}]});

        expect(await (await requests[0]!.formData()).get("memo_block[0]")).toBe("%3Cdiv%3Ex\r\ny%3C%2Fdiv%3E");
    });

    test("string content is treated as text block", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: "1", id: "g"}));
        await manager.write({gallery: "g", subject: "s", content: ["plain"]});

        expect(await (await requests[0]!.formData()).get("memo_block[0]")).toBe("%3Cdiv%3Eplain%3C%2Fdiv%3E");
    });

    test("login session sends user_id instead of name/password", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: "1", id: "g"}), loginSession);
        await manager.write({gallery: "g", subject: "s", content: ["x"]});

        const form = await requests[0]!.formData();
        expect(form.get("user_id")).toBe("confirm-user");
        expect(form.has("name")).toBe(false);
        expect(form.has("password")).toBe(false);
    });

    test("modify mode sends articleId as no", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: "1", id: "g"}));
        await manager.write({gallery: "g", subject: "s", content: ["x"], mode: "modify", articleId: 9});

        expect(await (await requests[0]!.formData()).get("no")).toBe("9");
    });

    test("dccon block sends imageTag and detail index", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: "1", id: "g"}));
        await manager.write({
            gallery: "g",
            subject: "s",
            content: [{type: "dccon", imageTag: "ddddd", detailIndex: 3}]
        });

        const form = await requests[0]!.formData();
        expect(form.get("memo_block[0]")).toBe("ddddd");
        expect(form.get("detail_idx[0]")).toBe("3");
    });

    test("captcha answer is appended to code/dcblock fields", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: "1", id: "g"}));
        await manager.write({
            gallery: "g",
            subject: "s",
            content: ["x"],
            captcha: {code: "1234", dccode: "sess"}
        });

        const form = await requests[0]!.formData();
        expect(form.get("code")).toBe("sess");
        expect(form.get("dcblock")).toBe("1234");
    });

    test("rejects empty subject, empty content, modify without articleId", async () => {
        const {manager} = makeManager(() => json({result: true}));
        await expect(manager.write({gallery: "g", subject: "  ", content: ["x"]})).rejects.toThrow();
        await expect(manager.write({gallery: "g", subject: "s", content: []})).rejects.toThrow();
        await expect(manager.write({gallery: "g", subject: "s", content: ["x"], mode: "modify"})).rejects.toThrow();
    });

    test("requires a session", async () => {
        const {auth} = mockAuth();
        const {http} = mockHttp(() => json({result: true}));
        const manager = new ArticleManager(http, auth, () => null);
        await expect(manager.write({gallery: "g", subject: "s", content: ["x"]})).rejects.toThrow("session is required");
    });

    test("captcha cause throws CaptchaRequiredError with challenge", async () => {
        const {manager} = makeManager(() =>
            json([{result: false, cause: "자동입력 보안코드", captcha_url: "https://x/c.png", captcha: "cap1"}])
        );
        try {
            await manager.write({gallery: "g", subject: "s", content: ["x"]});
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(CaptchaRequiredError);
            const captcha = error as CaptchaRequiredError;
            expect(captcha.message).toContain("보안코드");
            expect(captcha.action).toBe("writeArticle");
            expect(captcha.challenge).toEqual({imageUrl: "https://x/c.png", captcha: "cap1"});
        }
    });
});

describe("ArticleManager actions", () => {
    test("upvote appends captcha fields and returns json", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: null, member: 0}));
        await manager.upvote({gallery: "g", articleId: 1, captcha: {code: "9", captcha: "legacy"}});

        const form = await requests[0]!.formData();
        expect(form.get("rand_code")).toBe("legacy");
        expect(form.get("captcha_code")).toBe("9");
    });

    test("delete sends write_pw for anonymous session", async () => {
        const {manager, requests} = makeManager(() => json({result: true, cause: null}));
        await manager.delete({gallery: "g", articleId: 1});

        const form = await requests[0]!.formData();
        expect(form.get("mode")).toBe("board_del");
        expect(form.get("write_pw")).toBe("pw");
    });

    test("reportLink includes app_id and confirm_id", async () => {
        const {manager} = makeManager(() => json({}), loginSession);
        const link = await manager.reportLink({gallery: "g", articleId: 5});

        const url = new URL(link);
        expect(url.searchParams.get("app_id")).toBe("app-id");
        expect(url.searchParams.get("confirm_id")).toBe("confirm-user");
        expect(url.searchParams.get("no")).toBe("5");
    });
});

describe("scoped managers", () => {
    test("gallery scope fills gallery, article scope fills gallery and articleId", async () => {
        const {manager, requests} = makeManager(() => json(listBody([1])));
        await manager.gallery("mi$scoped").list({page: 2});
        await manager.article("mi$scoped", 42).read();

        const listUrl = unwrapHash(requests[0]!);
        expect(listUrl.searchParams.get("id")).toBe("mi$scoped");
        expect(listUrl.searchParams.get("page")).toBe("2");
        const readUrl = unwrapHash(requests[1]!);
        expect(readUrl.searchParams.get("no")).toBe("42");
    });
});
