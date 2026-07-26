import {describe, expect, test} from "bun:test";
import {
    captchaImageUrl,
    captchaKindForAction,
    createCaptchaChallenge,
    createCaptchaDccode,
    downloadCaptchaImage
} from "../src/modules/captcha";

describe("captchaImageUrl", () => {
    test("builds per-kind URLs", () => {
        expect(captchaImageUrl({kind: "login", dccode: "abc"}))
            .toBe("https://app.dcinside.com/captcha/code?id=login_botchk&type=L&dccode=abc");
        expect(captchaImageUrl({kind: "article", galleryId: "mi$x", dccode: "abc"}))
            .toBe("https://app.dcinside.com/code.php?id=mi%24x&dccode=abc");
        expect(captchaImageUrl({kind: "comment", galleryId: "g", dccode: "abc"}))
            .toBe("https://app.dcinside.com/code_reple.php?type=C&id=g&dccode=abc");
        expect(captchaImageUrl({kind: "recommend", galleryId: "g", dccode: "abc"}))
            .toBe("https://app.dcinside.com/code_reple.php?type=R&id=g&dccode=abc");
    });

    test("requires dccode and gallery id", () => {
        expect(() => captchaImageUrl({kind: "login", dccode: " "})).toThrow("dccode");
        expect(() => captchaImageUrl({kind: "article", dccode: "abc"})).toThrow("gallery id");
    });
});

describe("captchaKindForAction", () => {
    test("maps actions to captcha kinds", () => {
        expect(captchaKindForAction("writeArticle")).toBe("article");
        expect(captchaKindForAction("modifyArticle")).toBe("article");
        expect(captchaKindForAction("writeComment")).toBe("comment");
        expect(captchaKindForAction("writeReply")).toBe("comment");
        expect(captchaKindForAction("voteArticle")).toBe("recommend");
        expect(captchaKindForAction("login")).toBe("login");
    });
});

describe("createCaptchaDccode", () => {
    test("returns 16 hex chars and varies by input", () => {
        const code = createCaptchaDccode();
        expect(code).toMatch(/^[0-9a-f]{16}$/);
        expect(createCaptchaDccode(1, () => 0.1)).not.toBe(createCaptchaDccode(2, () => 0.2));
    });
});

describe("createCaptchaChallenge", () => {
    test("returns image url and dccode", () => {
        const challenge = createCaptchaChallenge("voteArticle", "g");
        expect(challenge.imageUrl).toStartWith("https://app.dcinside.com/code_reple.php?type=R&id=g&dccode=");
        expect(challenge.captcha).toMatch(/^[0-9a-f]{16}$/);
    });
});

describe("downloadCaptchaImage", () => {
    const imageResponse = (body: BodyInit | null, status = 200, contentType = "image/png") =>
        (async () => new Response(body, {status, headers: {"content-type": contentType}})) as unknown as typeof fetch;

    test("returns bytes on success", async () => {
        const result = await downloadCaptchaImage({
            url: "https://x/y.png",
            fetch: imageResponse(new Uint8Array([1, 2, 3]))
        });
        expect(result.byteLength).toBe(3);
        expect(result.bytes).toEqual(Buffer.from([1, 2, 3]));
        expect(result.contentType).toBe("image/png");
    });

    test("throws on http error, wrong content-type, empty body", async () => {
        await expect(downloadCaptchaImage({url: "https://x", fetch: imageResponse("err", 500)}))
            .rejects.toThrow("HTTP 500");
        await expect(downloadCaptchaImage({url: "https://x", fetch: imageResponse("<html>", 200, "text/html")}))
            .rejects.toThrow("content-type mismatch");
        await expect(downloadCaptchaImage({url: "https://x", fetch: imageResponse(null)}))
            .rejects.toThrow("empty");
        await expect(downloadCaptchaImage({url: "  "})).rejects.toThrow("url is required");
    });
});
