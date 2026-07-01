import {afterAll, describe, expect, test} from "bun:test";
import {DCInsideClient, type GalleryType} from "../src";

const liveTimeout = 30_000;

let writtenArticle: { client: DCInsideClient; articleId: number } | null = null;

function createClient(): DCInsideClient {
    return new DCInsideClient();
}

async function fetchFirstArticle(client: DCInsideClient, galleryId: string, galleryType: GalleryType): Promise<number> {
    const list = await client.articles.list({
        galleryId,
        galleryType
    });

    const article = list.articles.find((item) => item.id > 0);

    expectNonEmptyGalleryTitle(list);
    expect(article).toBeDefined();

    return article!.id;
}

function expectNonEmptyGalleryTitle(list: Awaited<ReturnType<DCInsideClient["articles"]["list"]>>): void {
    if (list.gallery.title.length === 0) {
        throw new Error(`Expected non-empty gallery title. Response shape: ${summarizeJson(list.raw)}`);
    }
}

function summarizeJson(value: unknown): string {
    if (Array.isArray(value)) {
        return `array(${value.length})[${value.slice(0, 3).map(summarizeJson).join(", ")}]`;
    }

    if (value && typeof value === "object") {
        const object = value as Record<string, unknown>;
        return `object{${Object.keys(object).slice(0, 12).join(", ")}}`;
    }

    return String(value);
}

describe("DCInside live integration", () => {
    const galleryId = "bjwg64";
    const galleryType: GalleryType = "mini";

    afterAll(async () => {
        if (!writtenArticle) return;

        await writtenArticle.client.articles.delete({
            galleryId,
            galleryType,
            articleId: writtenArticle.articleId
        }).catch(() => null);
    });

    test("loads the first article list page", async () => {
        const client = createClient();
        const list = await client.articles.list({
            galleryId,
            galleryType
        });

        expectNonEmptyGalleryTitle(list);
        expect(list.articles.length).toBeGreaterThan(0);
        expect(list.articles[0]!.subject.length).toBeGreaterThan(0);
    }, liveTimeout);


    test("reads an article from a typed gallery list", async () => {
        const client = createClient();
        const articleId = await fetchFirstArticle(client, galleryId, galleryType);
        const article = await client.articles.read({
            galleryId,
            galleryType,
            articleId
        });

        expect(article.info.id).toBe(articleId);
        expect(article.info.subject.length).toBeGreaterThan(0);
        expect(article.main.content).toBeDefined();
    }, liveTimeout);

    test("loads comments for an article from a typed gallery list", async () => {
        const client = createClient();
        const articleId = await fetchFirstArticle(client, galleryId, galleryType);
        const comments = await client.comments.list({
            galleryId,
            galleryType,
            articleId
        });

        expect(comments.page).toBeGreaterThanOrEqual(1);
        expect(comments.totalPages).toBeGreaterThanOrEqual(0);
        expect(comments.comments.length).toBeGreaterThanOrEqual(0);
    }, liveTimeout);
});

describe("DCInside write integration", () => {
    const galleryId = "bjwg64";
    const galleryType: GalleryType = "mini";

    afterAll(async () => {
        if (!writtenArticle) return;

        await writtenArticle.client.articles.delete({
            galleryId,
            galleryType,
            articleId: writtenArticle.articleId
        }).catch(() => null);
    });

    // write API는 rate limit에 걸릴 수 있으므로 실패 시 스킵
    test("writes an anonymous article and comment", async () => {
        const nickname = `ㅇㅇ`;
        const password = `${Date.now()}`;
        const client = createClient();
        client.useAnonymous(nickname, password);

        const stamp = new Date().toISOString();
        const written = await client.articles.write({
            galleryId,
            galleryType,
            subject: `test`,
            content: [
                {
                    type: "text",
                    text: `dcinside.js ${stamp}`
                }
            ]
        });

        expect(written.result).toBe(true);
        expect(written.articleId).toBeNumber();

        const articleId = written.articleId!;
        writtenArticle = {client, articleId};

        const comment = await client.comments.write({
            galleryId,
            galleryType,
            articleId,
            content: `dcinside.js comment integration test ${stamp}`
        });

        expect(comment.result).toBe(true);
    }, liveTimeout);
});