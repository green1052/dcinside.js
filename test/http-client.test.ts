import {describe, expect, test} from "bun:test";
import {buildFormData, KyHttpClient, postMultipartJson, type DCInsideRequestContext} from "../src/core/http";
import {HTTPError} from "../src/core/http/errors";

function makeContext(state: {appId: string}, counters: {refreshAppId: number}): DCInsideRequestContext {
    return {
        getAppId: async () => state.appId,
        getClientToken: () => "ctoken",
        ensureClientToken: async () => "ctoken",
        getUserId: () => null,
        refreshAppId: async () => {
            counters.refreshAppId++;
            state.appId = "NEW";
            return state.appId;
        },
        refreshLogin: async () => {
            throw new Error("refreshLogin should not be called");
        }
    };
}

/** redirect.php?hash=... 형태의 요청 URL에서 원본 URL을 복원합니다. */
function unwrapHash(request: Request): URL {
    const hash = new URL(request.url).searchParams.get("hash");
    expect(hash).not.toBeNull();
    return new URL(Buffer.from(hash!, "base64").toString());
}

describe("KyHttpClient auth retry", () => {
    test("GET retries once with a freshly injected app_id", async () => {
        const calls: Request[] = [];
        const fetchMock = (async (input: Request) => {
            calls.push(input.clone());
            if (calls.length === 1) {
                return new Response(JSON.stringify([{result: false, cause: "certification"}]), {status: 403});
            }
            return new Response(JSON.stringify({result: true}), {status: 200});
        }) as unknown as typeof fetch;

        const state = {appId: "OLD"};
        const counters = {refreshAppId: 0};
        const http = new KyHttpClient({fetch: fetchMock});
        http.useDCInsideContext(makeContext(state, counters));

        const json = await http.ky.get("https://app.dcinside.com/api/gall_list_new.php?id=test").json();

        expect(json).toEqual({result: true});
        expect(calls.length).toBe(2);
        expect(counters.refreshAppId).toBe(1);
        expect(unwrapHash(calls[0]!).searchParams.get("app_id")).toBe("OLD");
        const retried = unwrapHash(calls[1]!);
        expect(retried.searchParams.get("app_id")).toBe("NEW");
        expect(retried.searchParams.get("id")).toBe("test");
        expect(calls[1]!.headers.get("x-dcjs-auth-retried")).toBe("1");
    });

    test("POST multipart retries once with a freshly injected app_id", async () => {
        const calls: Request[] = [];
        const fetchMock = (async (input: Request) => {
            calls.push(input.clone());
            if (calls.length === 1) {
                return new Response(JSON.stringify({result: false, cause: "certification"}), {status: 403});
            }
            return new Response(JSON.stringify({result: true}), {status: 200});
        }) as unknown as typeof fetch;

        const state = {appId: "OLD"};
        const counters = {refreshAppId: 0};
        const http = new KyHttpClient({fetch: fetchMock});
        http.useDCInsideContext(makeContext(state, counters));

        const json = await postMultipartJson(http, "https://app.dcinside.com/api/dccon.php", {type: "list"});

        expect(json).toEqual({result: true});
        expect(calls.length).toBe(2);
        expect((await calls[0]!.formData()).get("app_id")).toBe("OLD");
        const retriedForm = await calls[1]!.formData();
        expect(retriedForm.get("app_id")).toBe("NEW");
        expect(retriedForm.get("type")).toBe("list");
    });

    test("retry happens at most once, then throws HTTPError", async () => {
        let callCount = 0;
        const fetchMock = (async () => {
            callCount++;
            return new Response(JSON.stringify({result: false, cause: "certification"}), {status: 403});
        }) as unknown as typeof fetch;

        const state = {appId: "OLD"};
        const counters = {refreshAppId: 0};
        const http = new KyHttpClient({fetch: fetchMock});
        http.useDCInsideContext(makeContext(state, counters));

        const promise = http.ky.get("https://app.dcinside.com/api/gall_list_new.php?id=test").json();
        await expect(promise).rejects.toBeInstanceOf(HTTPError);
        expect(callCount).toBe(2);
        expect(counters.refreshAppId).toBe(1);
    });

    test("non-auth errors throw HTTPError without retry", async () => {
        let callCount = 0;
        const fetchMock = (async () => {
            callCount++;
            return new Response("server error", {status: 500});
        }) as unknown as typeof fetch;

        const http = new KyHttpClient({fetch: fetchMock});
        const promise = http.ky.get("https://app.dcinside.com/api/gall_list_new.php").json();
        await expect(promise).rejects.toBeInstanceOf(HTTPError);
        expect(callCount).toBe(1);
    });
});

describe("buildFormData", () => {
    test("skips null/undefined, stringifies scalars, appends arrays", () => {
        const form = buildFormData({
            a: "text",
            b: 42,
            c: true,
            skip: null,
            skip2: undefined,
            list: [1, 2],
            blob: new Blob(["x"])
        });
        expect(form.get("a")).toBe("text");
        expect(form.get("b")).toBe("42");
        expect(form.get("c")).toBe("true");
        expect(form.has("skip")).toBe(false);
        expect(form.has("skip2")).toBe(false);
        expect(form.getAll("list")).toEqual(["1", "2"]);
        expect(form.get("blob")).toBeInstanceOf(Blob);
    });
});
