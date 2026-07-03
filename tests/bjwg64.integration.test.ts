import {afterAll, describe, expect, test} from "bun:test";
import {type ArticleListResult, DCInsideClient} from "../src";

const liveTimeout = 30_000;

let writtenArticle: { client: DCInsideClient; articleId: number } | null = null;

function createClient(): DCInsideClient {
    return new DCInsideClient();
}

async function fetchFirstArticle(client: DCInsideClient, gallery: string): Promise<number> {
    const list = await client.gallery(gallery).articles.list();

    const article = list.articles.find((item) => item.id > 0);

    expectNonEmptyGalleryTitle(list);
    expect(article).toBeDefined();

    return article!.id;
}

function expectNonEmptyGalleryTitle(list: ArticleListResult): void {
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
    const gallery = "mi$bjwg64";

    afterAll(async () => {
        if (!writtenArticle) return;

        await writtenArticle.client.gallery(gallery).article(writtenArticle.articleId).delete().catch(() => null);
    });

    test("loads the first article list page", async () => {
        const client = createClient();
        const list = await client.gallery(gallery).articles.list();

        expectNonEmptyGalleryTitle(list);
        expect(list.articles.length).toBeGreaterThan(0);
        expect(list.articles[0]!.subject.length).toBeGreaterThan(0);
    }, liveTimeout);


    test("reads an article from a typed gallery list", async () => {
        const client = createClient();
        const articleId = await fetchFirstArticle(client, gallery);
        const article = await client.gallery(gallery).article(articleId).read();

        expect(article.info.id).toBe(articleId);
        expect(article.info.subject.length).toBeGreaterThan(0);
        expect(article.main.content).toBeDefined();
    }, liveTimeout);

    test("loads comments for an article from a typed gallery list", async () => {
        const client = createClient();
        const articleId = await fetchFirstArticle(client, gallery);
        const comments = await client.gallery(gallery).article(articleId).comments.list();

        expect(comments.page).toBeGreaterThanOrEqual(1);
        expect(comments.totalPages).toBeGreaterThanOrEqual(0);
        expect(comments.comments.length).toBeGreaterThanOrEqual(0);
    }, liveTimeout);
});

describe("DCInside write integration", () => {
    const gallery = "mi$bjwg64";

    afterAll(async () => {
        if (!writtenArticle) return;

        await writtenArticle.client.gallery(gallery).article(writtenArticle.articleId).delete().catch(() => null);
    });

    test("writes an anonymous article and comment", async () => {
        const client = createClient();
        client.useAnonymous("ㅇㅇ", `${Date.now()}`);
        const galleryClient = client.gallery(gallery);

        const written = await galleryClient.articles.write({
            subject: "dcinside.js",
            headText: {
                no: 0,
                name: "일반"
            },
            content: [
                "dcinside.js"
            ]
        });

        expect(written.result).toBe(true);
        expect(written.articleId).toBeNumber();

        const articleId = written.articleId!;
        writtenArticle = {client, articleId};
        const article = galleryClient.article(articleId);

        const comment = await article.comments.write({
            content: "dcinside.js"
        });

        expect(comment.result).toBe(true);

        const reply = await article.comments.reply({
            content: "dcinside.js reply",
            replyToCommentId: comment.data!
        });

        expect(reply.result).toBe(true);
    }, liveTimeout);
});