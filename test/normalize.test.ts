import {describe, expect, test} from "bun:test";
import {normalize} from "../src/normalize";
import {json, makeClient} from "./helpers";

describe("normalize (app Gson rules)", () => {
    test("scalars", () => {
        expect(normalize(12, "s")).toBe("12");
        expect(normalize(true, "s")).toBe("true");
        expect(normalize(null, "s")).toBeUndefined();

        // IntTypeAdapter: null/"" -> 0, boolean -> 1/0, numeric string -> int
        expect(normalize("42", "i")).toBe(42);
        expect(normalize("", "i")).toBe(0);
        expect(normalize(null, "i")).toBe(0);
        expect(normalize(true, "i")).toBe(1);
        expect(normalize("abc", "i")).toBeUndefined();

        expect(normalize("1.5", "n")).toBe(1.5);
        expect(normalize("", "n")).toBeUndefined();

        expect(normalize("true", "b")).toBe(true);
        expect(normalize("Y", "b")).toBe(true);
        expect(normalize(0, "b")).toBe(false);
    });

    test("models keep unknown keys and drop values that cannot be converted", () => {
        const result = normalize({no: "100", subject: 7, extra: "kept", member_icon: "x"}, "PostItem");
        expect(result).toEqual({no: 100, subject: "7", extra: "kept"});
    });

    test("arrays accept PHP-style numeric-key objects", () => {
        expect(normalize({0: {no: "1"}, 1: {no: "2"}}, "PostItem[]")).toEqual([{no: 1}, {no: 2}]);
    });

    test("API responses come back with the declared types", async () => {
        const {dc} = makeClient(() => json([{
            result: true,
            gall_info: [{gall_title: "프로그래밍", is_minor: "false", file_cnt: "5"}],
            gall_list: [{no: "123", hit: "45", subject: 999, member_icon: null}]
        }]));
        const list = await dc.articles.list({gallery: "programming"});

        expect(list.result).toBe("true");
        expect(list.gall_info?.[0]).toEqual({gall_title: "프로그래밍", is_minor: false, file_cnt: 5});
        expect(list.gall_list?.[0]).toEqual({no: 123, hit: 45, subject: "999", member_icon: 0});
    });
});
