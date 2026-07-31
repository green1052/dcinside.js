import {paginate, type PaginationNextPage} from "fetch-extras";
import type {AuthManager} from "../core/auth";
import {type KyHttpClient, postMultipartJson} from "../core/http";
import {apiError, isApiError, isCaptchaCause, readCaptchaChallenge, shouldRefreshAppId} from "../core/http/api-error";
import {API_URL} from "../core/http/constants";
import {CaptchaRequiredError} from "../core/http/errors";
import {booleanValue, firstObject, nullableString, objectValue} from "../core/http/json";
import {escapeMemoHtml} from "../core/http/utils";
import {requireSession} from "../core/session";
import type {
    ArticleContent,
    ArticleDeleteOptions,
    ArticleDeleteResult,
    ArticleListOptions,
    ArticleListResult,
    ArticleModifyInfoOptions,
    ArticleModifyInfoResult,
    ArticleReadOptions,
    ArticleReadResult,
    ArticleVoteOptions,
    ArticleVoteResult,
    ArticleWriteOptions,
    ArticleWriteResult,
    CaptchaAnswer,
    Session
} from "../core/types";

export type GalleryArticleScopedOptions<T extends { gallery: string }> = Omit<T, "gallery">;
export type ArticleEntryScopedOptions<T extends {
    gallery: string;
    articleId: number
}> = Omit<T, "gallery" | "articleId">;

/** `encodeURIComponent` 후 `%20`을 `+`로 변환합니다. DCInside 폼 필드 인코딩 규칙입니다. */
function encodeFormValue(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, "+");
}

/** `encodeFormValue` 후 `%0A`를 줄바꿈으로 복원합니다. DCInside memo block은 줄바꿈을 인코딩하지 않습니다. */
function encodeMemoBlock(value: string): string {
    return encodeFormValue(value).replace(/%0A/g, "\n");
}

function encodeTextMemoBlock(value: string): string {
    return encodeMemoBlock(`<div>${escapeMemoHtml(value)}</div>`);
}

/**
 * 디시인사이드 게시글 API 매니저입니다.
 *
 * 목록/읽기 요청은 app_id가 만료되면 한 번 자동 갱신해 재시도합니다.
 * 작성, 삭제, 추천처럼 세션이 필요한 작업은 `client.login(...)` 또는
 * `client.useAnonymous(...)`를 먼저 호출해야 합니다.
 */
export class ArticleManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly auth: AuthManager,
        private readonly getSession: () => Session | null
    ) {
    }

    gallery(gallery: string): ScopedGalleryArticleManager {
        return new ScopedGalleryArticleManager(this, gallery);
    }

    article(gallery: string, articleId: number): ScopedArticleEntryManager {
        return new ScopedArticleEntryManager(this, gallery, articleId);
    }

    /**
     * 게시글 목록과 갤러리 메타데이터를 불러옵니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 페이지, 검색 조건, 추천글/공지/말머리 필터입니다.
     * @returns 갤러리 정보, 게시글 목록, 원본 응답입니다.
     */
    async list(options: ArticleListOptions): Promise<ArticleListResult> {
        return this.listWithAppId(options, true);
    }

    /**
     * 게시글 목록을 페이지 단위로 비동기 순회합니다.
     *
     * 각 yield는 한 페이지의 {@link ArticleListResult}입니다. 빈 목록 페이지를
     * 받으면 자동으로 종료합니다. `refresh_join` 만료 시 한 번 app_id를 갱신해
     * 같은 페이지를 재요청합니다.
     *
     * @param options `page`를 제외한 {@link ArticleListOptions}. 시작 페이지는 `page`로 지정(기본 1).
     * @returns 한 페이지 결과를 순차적으로 yield하는 async iterator.
     */
    async *listPages(options: ArticleListOptions): AsyncIterableIterator<ArticleListResult> {
        let refreshed = false;
        let page = options.page ?? 1;
        const galleryId = options.gallery;
        const baseUrl = new URL(API_URL.article.list);
        baseUrl.searchParams.set("id", galleryId);
        if (options.searchKeyword) {
            baseUrl.searchParams.set("s_type", options.searchType ?? "all");
            baseUrl.searchParams.set("serVal", options.searchKeyword);
        }
        if (options.recommend) baseUrl.searchParams.set("recommend", "1");
        if (options.notice) baseUrl.searchParams.set("notice", "1");
        if (options.headId && options.headId > 0) baseUrl.searchParams.set("headid", String(options.headId));

        const requestPage = (): URL => {
            const url = new URL(baseUrl);
            url.searchParams.set("page", String(page));
            return url;
        };

        for await (const result of paginate(requestPage(), {
            fetchFunction: this.http.ky,
            pagination: {
                transform: async (response): Promise<ArticleListResult[]> => {
                    const raw = await response.json();
                    const root = firstObject(raw);
                    if (isApiError(root)) {
                        if (!refreshed && shouldRefreshAppId(root)) {
                            await this.auth.refreshAppId({refreshClientToken: true});
                            refreshed = true;
                            return [];
                        }
                        throw apiError("load article list", root);
                    }
                    refreshed = false;
                    return [root as unknown as ArticleListResult];
                },
                paginate: ({currentItems}): PaginationNextPage | false => {
                    if (currentItems.length === 0) return false;
                    const last = currentItems[currentItems.length - 1] as ArticleListResult;
                    if (!last.gall_list || last.gall_list.length === 0) return false;
                    page++;
                    return {url: requestPage()};
                }
            }
        })) {
            yield result;
        }
    }

    /**
     * 단일 게시글의 메타데이터와 본문을 읽습니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 게시글 번호입니다.
     * @returns 게시글 정보, 본문/추천수 정보, 원본 응답입니다.
     */
    async read(options: ArticleReadOptions): Promise<ArticleReadResult> {
        return this.readWithAppId(options, true);
    }

    /**
     * 게시글을 작성하거나 수정합니다.
     *
     * `mode: "modify"`를 사용할 때는 `articleId`가 필요합니다. 익명 세션은
     * 닉네임과 비밀번호를, 로그인 세션은 confirm_id/user_id를 자동 전송합니다.
     * 캡챠가 필요하면 `captcha`에 답변을 전달하고, 성인 갤러리면 `adultCode`를 전달합니다.
     *
     * @param options 작성 대상 갤러리, 제목, 본문 블록, 말머리, 작성/수정 모드입니다.
     * @returns 성공 여부, 생성/수정된 게시글 번호, 서버 메시지입니다.
     */
    async write(options: ArticleWriteOptions): Promise<ArticleWriteResult> {
        const session = this.requireSession("write articles");
        const galleryId = options.gallery;
        const subject = options.subject.trim();

        if (!subject) throw new Error("Article subject is required.");
        if (options.content.length === 0) throw new Error("Article content must contain at least one block.");
        if (options.mode === "modify" && !options.articleId) {
            throw new Error("articleId is required when writing with mode: \"modify\".");
        }

        const action: "writeArticle" | "modifyArticle" = options.mode === "modify" ? "modifyArticle" : "writeArticle";
        const appId = await this.auth.getAppId();
        const multipart: Record<string, string | number | boolean | Blob | File | null | undefined> = {
            id: galleryId,
            app_id: appId,
            mode: options.mode ?? "write",
            client_token: this.auth.fcmToken ?? "",
            no: options.mode === "modify" ? options.articleId : undefined
        };

        if (options.headText) {
            multipart["head_name"] = options.headText.name;
            multipart["head_no"] = String(options.headText.no);
        }

        multipart["subject"] = encodeFormValue(subject);

        if (session.user.type === "anonymous") {
            multipart["name"] = encodeFormValue(session.user.id);
            multipart["password"] = encodeFormValue(session.user.password);
        } else if (session.detail) {
            multipart["user_id"] = session.detail.userId;
        }

        let imageCount = 0;
        options.content.forEach((content, index) => {
            const normalized = normalizeArticleContent(content);

            if (normalized.type === "text") {
                multipart[`memo_block[${index}]`] = encodeTextMemoBlock(normalized.text);
            } else if (normalized.type === "html") {
                multipart[`memo_block[${index}]`] = encodeMemoBlock(normalized.html);
            } else if (normalized.type === "markdown") {
                multipart[`memo_block[${index}]`] = encodeTextMemoBlock(normalized.markdown);
            } else if (normalized.type === "image") {
                multipart[`memo_block[${index}]`] = `Dc_App_Img_${imageCount}`;
                multipart[`upload[${imageCount}]`] = normalized.file;
                imageCount++;
            } else {
                multipart[`memo_block[${index}]`] = encodeFormValue(normalized.imageTag);
                multipart[`detail_idx[${index}]`] = normalized.detailIndex;
            }
        });

        multipart["fix"] = "";
        multipart["secret_use"] = "0";
        multipart["is_quick"] = "0";
        multipart["use_gall_nickname"] = "0";
        multipart["write_movie"] = "0";

        appendArticleCaptcha(multipart, options.captcha);
        if (options.adultCode) multipart["adult_code"] = options.adultCode;

        const raw = await postMultipartJson(this.http, API_URL.article.write, multipart);
        const json = firstObject(raw);
        if (isApiError(json)) {
            const cause = nullableString(json["cause"]) ?? "failed to write article";
            if (isCaptchaCause(cause)) {
                throw new CaptchaRequiredError(cause, action, readCaptchaChallenge(raw));
            }
            throw apiError(action === "modifyArticle" ? "modify article" : "write article", json);
        }

        return json as unknown as ArticleWriteResult;
    }

    /**
     * 게시글을 삭제합니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 삭제할 게시글 번호입니다.
     * @returns 삭제 성공 여부와 서버 메시지입니다.
     */
    async delete(options: ArticleDeleteOptions): Promise<ArticleDeleteResult> {
        const session = this.requireSession("delete articles");
        const galleryId = options.gallery;
        const json = await this.uploadArticleAction(API_URL.article.delete, {
            id: galleryId,
            no: options.articleId,
            mode: "board_del",
            write_pw: session.user.type === "anonymous" ? session.user.password : undefined
        });
        return json as unknown as ArticleDeleteResult;
    }

    /**
     * 게시글을 추천합니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 게시글 번호입니다.
     * @returns 추천 성공 여부와 서버 응답 정보입니다.
     */
    async upvote(options: ArticleVoteOptions): Promise<ArticleVoteResult> {
        return this.vote(API_URL.article.upvote, options);
    }

    /**
     * 게시글을 비추천합니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 게시글 번호입니다.
     * @returns 비추천 성공 여부와 서버 응답 정보입니다.
     */
    async downvote(options: ArticleVoteOptions): Promise<ArticleVoteResult> {
        return this.vote(API_URL.article.downvote, options);
    }

    /**
     * hit_recommend 엔드포인트로 게시글을 추천합니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 게시글 번호입니다.
     * @returns 추천 성공 여부와 서버 응답 정보입니다.
     */
    async hitUpvote(options: ArticleVoteOptions): Promise<ArticleVoteResult> {
        return this.vote(API_URL.article.hitUpvote, options);
    }

    /**
     * 모바일 웹 신고 페이지 URL을 생성합니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 신고할 게시글 번호입니다.
     * @returns app_id와 로그인 confirm_id가 포함된 신고 URL입니다.
     */
    async reportLink(options: ArticleVoteOptions): Promise<string> {
        const appId = await this.auth.getAppId();
        const galleryId = options.gallery;
        const url = new URL(API_URL.article.report);
        url.searchParams.set("app_id", appId);
        url.searchParams.set("id", galleryId);
        url.searchParams.set("no", String(options.articleId));

        const session = this.getSession();
        if (session?.detail) url.searchParams.set("confirm_id", session.detail.userId);

        return url.toString();
    }

    /**
     * 게시글 수정 화면에 필요한 기존 본문, 첨부, 말머리 정보를 불러옵니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 수정할 게시글 번호입니다.
     * @returns 기존 제목/본문/첨부/말머리 정보입니다.
     */
    async modifyInfo(options: ArticleModifyInfoOptions): Promise<ArticleModifyInfoResult> {
        const session = this.requireSession("load article modify info");
        const galleryId = options.gallery;
        const multipart: Record<string, string | number | boolean | null | undefined> = {
            id: galleryId,
            no: options.articleId
        };

        if (session.user.type === "anonymous") {
            multipart["password"] = session.user.password;
        }

        const raw = await postMultipartJson(this.http, API_URL.article.modify, multipart);
        const json = firstObject(raw);
        return json as unknown as ArticleModifyInfoResult;
    }

    private async listWithAppId(
        options: ArticleListOptions,
        retryOnRefresh: boolean
    ): Promise<ArticleListResult> {
        const galleryId = options.gallery;
        const url = new URL(API_URL.article.list);
        url.searchParams.set("id", galleryId);
        url.searchParams.set("page", String(options.page ?? 1));

        if (options.searchKeyword) {
            url.searchParams.set("s_type", options.searchType ?? "all");
            url.searchParams.set("serVal", options.searchKeyword);
        }
        if (options.recommend) url.searchParams.set("recommend", "1");
        if (options.notice) url.searchParams.set("notice", "1");
        if (options.headId && options.headId > 0) url.searchParams.set("headid", String(options.headId));

        const raw = await this.http.ky.get(url.toString()).json();
        const root = firstObject(raw);
        if (isApiError(root)) {
            if (retryOnRefresh && shouldRefreshAppId(root)) {
                await this.auth.refreshAppId({refreshClientToken: true});
                return this.listWithAppId(options, false);
            }
            throw apiError("load article list", root);
        }

        return root as unknown as ArticleListResult;
    }

    private async readWithAppId(
        options: ArticleReadOptions,
        retryOnRefresh: boolean
    ): Promise<ArticleReadResult> {
        const galleryId = options.gallery;
        const url = new URL(API_URL.article.read);
        url.searchParams.set("id", galleryId);
        url.searchParams.set("no", String(options.articleId));

        const raw = await this.http.ky.get(url.toString()).json();
        const root = firstObject(raw);
        if (isApiError(root)) {
            if (retryOnRefresh && shouldRefreshAppId(root)) {
                await this.auth.refreshAppId({refreshClientToken: true});
                return this.readWithAppId(options, false);
            }
            throw apiError("read article", root);
        }

        return root as unknown as ArticleReadResult;
    }

    private async vote(url: string, options: ArticleVoteOptions): Promise<ArticleVoteResult> {
        const galleryId = options.gallery;
        const json = await this.uploadArticleAction(url, {
            id: galleryId,
            no: options.articleId,
            ...(options.captcha ? {
                rand_code: options.captcha.dccode ?? options.captcha.captcha ?? "",
                captcha_code: options.captcha.code
            } : {})
        });

        const cause = nullableString(json["cause"]) ?? "";
        if (!booleanValue(json["result"]) && isCaptchaCause(cause)) {
            throw new CaptchaRequiredError(cause, "voteArticle", readCaptchaChallenge(json));
        }

        return json as unknown as ArticleVoteResult;
    }

    /** 추천, 비추천, 삭제 같은 multipart POST 액션을 전송하고 API 에러를 처리합니다. */
    private async uploadArticleAction(
        url: string,
        multipart: Record<string, string | number | boolean | Blob | File | null | undefined>
    ): Promise<Record<string, unknown>> {
        const raw = await postMultipartJson(this.http, url, multipart);
        const json = firstObject(raw);
        if (isApiError(json)) throw apiError("complete article action", json);
        return json;
    }

    /** 세션이 필요한 작업에서 현재 세션을 가져오거나 에러를 던집니다. */
    private requireSession(action: string): Session {
        return requireSession(this.getSession, action);
    }
}

/** 글 작성 multipart에 캡챠 답변 필드(`code`, `dcblock`)를 추가합니다. */
function appendArticleCaptcha(
    multipart: Record<string, string | number | boolean | Blob | File | null | undefined>,
    captcha?: CaptchaAnswer
): void {
    if (!captcha?.code) return;
    multipart["code"] = captcha.dccode ?? captcha.captcha ?? "";
    multipart["dcblock"] = captcha.code;
}

export class ScopedGalleryArticleManager {
    constructor(
        private readonly manager: ArticleManager,
        private readonly gallery: string
    ) {
    }

    list(options: GalleryArticleScopedOptions<ArticleListOptions> = {}): Promise<ArticleListResult> {
        return this.manager.list({...options, gallery: this.gallery});
    }

    listPages(options: GalleryArticleScopedOptions<ArticleListOptions> = {}): AsyncIterableIterator<ArticleListResult> {
        return this.manager.listPages({...options, gallery: this.gallery});
    }

    write(options: GalleryArticleScopedOptions<ArticleWriteOptions>): Promise<ArticleWriteResult> {
        return this.manager.write({...options, gallery: this.gallery});
    }
}

export class ScopedArticleEntryManager {
    constructor(
        private readonly manager: ArticleManager,
        private readonly gallery: string,
        readonly articleId: number
    ) {
    }

    read(): Promise<ArticleReadResult> {
        return this.manager.read({gallery: this.gallery, articleId: this.articleId});
    }

    delete(): Promise<ArticleDeleteResult> {
        return this.manager.delete({gallery: this.gallery, articleId: this.articleId});
    }

    upvote(options: ArticleEntryScopedOptions<ArticleVoteOptions> = {}): Promise<ArticleVoteResult> {
        return this.manager.upvote({...options, gallery: this.gallery, articleId: this.articleId});
    }

    downvote(options: ArticleEntryScopedOptions<ArticleVoteOptions> = {}): Promise<ArticleVoteResult> {
        return this.manager.downvote({...options, gallery: this.gallery, articleId: this.articleId});
    }

    hitUpvote(options: ArticleEntryScopedOptions<ArticleVoteOptions> = {}): Promise<ArticleVoteResult> {
        return this.manager.hitUpvote({...options, gallery: this.gallery, articleId: this.articleId});
    }

    reportLink(): Promise<string> {
        return this.manager.reportLink({gallery: this.gallery, articleId: this.articleId});
    }

    modifyInfo(): Promise<ArticleModifyInfoResult> {
        return this.manager.modifyInfo({gallery: this.gallery, articleId: this.articleId});
    }
}

function normalizeArticleContent(content: ArticleContent): Exclude<ArticleContent, string> {
    if (typeof content === "string") {
        return {
            type: "text",
            text: content
        };
    }
    return content;
}