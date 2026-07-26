import {describe, expect, test} from "bun:test";
import {parseAndroidCheckinResponse} from "../src/core/auth/checkin";
import {authExpiredKind, isApiError, readCaptchaChallenge} from "../src/core/http/api-error";
import {inferGalleryType, normalizeGalleryId} from "../src/core/http/gallery-id";
import {booleanValue, firstObject, numberValue, ynBoolean} from "../src/core/http/json";
import {decodeHtml, decodeMemo, dedupeDetailIndices, escapeHtml, escapeMemoHtml} from "../src/core/http/utils";

describe("utils", () => {
    test("escapeHtml escapes special characters", () => {
        expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
    });

    test("decodeHtml handles named, decimal, hex entities", () => {
        expect(decodeHtml("&lt;b&gt;&amp;&#39;&#x41;&nbsp;")).toBe("<b>&'A ");
        expect(decodeHtml("&#x110000;")).toBe("&#x110000;");
        expect(decodeHtml("&unknown;")).toBe("&unknown;");
    });

    test("decodeMemo converts br tags to newlines", () => {
        expect(decodeMemo("a&lt;br&gt;b<br>c<br/>d<br />e")).toBe("a\nb\nc\nd\ne");
    });

    test("escapeMemoHtml converts newlines, tabs, double spaces", () => {
        expect(escapeMemoHtml("a\nb\tc")).toBe("a<br>b&nbsp;&nbsp;&nbsp;&nbsp;c");
        expect(escapeMemoHtml("a  b")).toBe("a &nbsp;b");
        expect(escapeMemoHtml("<&>")).toBe("&lt;&amp;&gt;");
    });

    test("dedupeDetailIndices removes duplicates and non-positive values", () => {
        expect(dedupeDetailIndices([3, 3, 0, -1, 5])).toEqual([3, 5]);
        expect(dedupeDetailIndices(undefined, 7)).toEqual([7]);
        expect(dedupeDetailIndices([], 7)).toEqual([7]);
        expect(dedupeDetailIndices(undefined, undefined)).toEqual([]);
    });
});

describe("gallery-id", () => {
    test("normalizeGalleryId adds prefixes only when missing", () => {
        expect(normalizeGalleryId("abc", "mini")).toBe("mi$abc");
        expect(normalizeGalleryId("mi$abc", "mini")).toBe("mi$abc");
        expect(normalizeGalleryId("abc", "person")).toBe("pr$abc");
        expect(normalizeGalleryId("abc")).toBe("abc");
        expect(normalizeGalleryId("abc", "minor")).toBe("abc");
    });

    test("inferGalleryType detects prefixes", () => {
        expect(inferGalleryType("mi$abc")).toBe("mini");
        expect(inferGalleryType("pr$abc")).toBe("person");
        expect(inferGalleryType("abc")).toBe("main");
    });
});

describe("json", () => {
    test("firstObject unwraps arrays and numeric-keyed objects", () => {
        expect(firstObject([{a: 1}])).toEqual({a: 1});
        expect(firstObject({"0": {a: 1}, "1": {b: 2}})).toEqual({a: 1});
        expect(firstObject({a: 1})).toEqual({a: 1});
        expect(firstObject(null)).toEqual({});
    });

    test("booleanValue and ynBoolean parse server flags", () => {
        expect(booleanValue("true")).toBe(true);
        expect(booleanValue("Y")).toBe(true);
        expect(booleanValue("N")).toBe(false);
        expect(booleanValue(1)).toBe(true);
        expect(ynBoolean("Y")).toBe(true);
        expect(ynBoolean("N")).toBe(false);
        expect(ynBoolean(1)).toBe(true);
    });

    test("numberValue falls back on non-numeric input", () => {
        expect(numberValue("42")).toBe(42);
        expect(numberValue("abc", -1)).toBe(-1);
    });
});

describe("api-error", () => {
    test("isApiError detects result=false with cause", () => {
        expect(isApiError({result: false, cause: "err"})).toBe(true);
        expect(isApiError({result: true, cause: "ok"})).toBe(false);
        expect(isApiError({result: false})).toBe(false);
    });

    test("authExpiredKind maps causes", () => {
        expect(authExpiredKind("certification")).toBe("appId");
        expect(authExpiredKind("certification_login")).toBe("loginSession");
        expect(authExpiredKind("other")).toBe(null);
    });

    test("readCaptchaChallenge extracts image url and session id", () => {
        expect(readCaptchaChallenge([{captcha_url: "https://x/y.png", captcha: "abc"}]))
            .toEqual({imageUrl: "https://x/y.png", captcha: "abc"});
        expect(readCaptchaChallenge({captcha_url: "not-a-url"})).toEqual({});
    });
});

describe("checkin", () => {
    test("parseAndroidCheckinResponse reads fixed64 androidId/securityToken", () => {
        // field 7 (androidId), wiretype 1: key = (7<<3)|1 = 57; field 8: key = (8<<3)|1 = 65
        const bytes = new Uint8Array([
            57, 1, 0, 0, 0, 0, 0, 0, 0,
            65, 2, 0, 0, 0, 0, 0, 0, 0
        ]);
        expect(parseAndroidCheckinResponse(bytes)).toEqual({androidId: 1n, securityToken: 2n});
    });

    test("parseAndroidCheckinResponse throws when fields are missing", () => {
        expect(() => parseAndroidCheckinResponse(new Uint8Array([8, 1]))).toThrow();
    });
});
