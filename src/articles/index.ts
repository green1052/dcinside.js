import type {AuthManager} from "../auth";
import {type KyHttpClient, postMultipartJson} from "../http";
import {apiError, isApiError, shouldRefreshAppId} from "../http/api-error";
import {API_URL} from "../http/constants";
import {normalizeGalleryId} from "../http/gallery-id";
import {
    arrayValue,
    booleanValue,
    firstObject,
    nullableBoolean,
    nullableNumber,
    nullableString,
    nullableYnBoolean,
    numberValue,
    objectValue,
    stringValue,
    ynBoolean
} from "../http/json";
import {decodeHtml, escapeHtml} from "../http/utils";
import type {
    ArticleContent,
    ArticleDeleteOptions,
    ArticleDeleteResult,
    ArticleListItem,
    ArticleListOptions,
    ArticleListResult,
    ArticleModifyInfoOptions,
    ArticleModifyInfoResult,
    ArticleReadOptions,
    ArticleReadResult,
    ArticleViewInfo,
    ArticleViewMain,
    ArticleVoteOptions,
    ArticleVoteResult,
    ArticleWriteOptions,
    ArticleWriteResult,
    GalleryInfo,
    HeadText,
    Session
} from "../types";

function encodeFormValue(value: string): string {
    return encodeURIComponent(value)
        .replace(/[!'()~]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
        .replace(/%20/g, "+");
}

/** APK의 Gy()와 동일: URLEncoder.encode 후 %0A만 \n으로 복원한다. */
function encodeMemoBlock(value: string): string {
    return encodeFormValue(value)
        .replace(/%0A/g, "\n");
}

function encodeTextMemoBlock(value: string): string {
    return encodeMemoBlock(`<div>${escapeHtml(value)}</div>`);
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
     *
     * @param options 작성 대상 갤러리, 제목, 본문 블록, 말머리, 작성/수정 모드입니다.
     * @returns 성공 여부, 생성/수정된 게시글 번호, 서버 메시지입니다.
     */
    async write(options: ArticleWriteOptions): Promise<ArticleWriteResult> {
        const session = this.requireSession("write articles");
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
        const subject = options.subject.trim();

        if (!subject) throw new Error("Article subject is required.");
        if (options.content.length === 0) throw new Error("Article content must contain at least one block.");
        if (options.mode === "modify" && !options.articleId) {
            throw new Error("articleId is required when writing with mode: \"modify\".");
        }

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

        const raw = await postMultipartJson(this.http, API_URL.article.write, multipart);
        const json = firstObject(raw);

        if (isApiError(json)) throw apiError("write article", json);

        return {
            result: booleanValue(json["result"]),
            articleId: nullableNumber(json["cause"]),
            galleryId: nullableString(json["id"]),
            cause: nullableString(json["cause"])
        };
    }

    /**
     * 게시글을 삭제합니다.
     *
     * @param options 갤러리 ID, 갤러리 타입, 삭제할 게시글 번호입니다.
     * @returns 삭제 성공 여부와 서버 메시지입니다.
     */
    async delete(options: ArticleDeleteOptions): Promise<ArticleDeleteResult> {
        const session = this.requireSession("delete articles");
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
        const json = await this.uploadArticleAction(API_URL.article.delete, {
            id: galleryId,
            no: options.articleId,
            mode: "board_del",
            write_pw: session.user.type === "anonymous" ? session.user.password : undefined
        });

        return {
            result: booleanValue(json["result"]),
            message: nullableString(json["message"]),
            status: nullableNumber(json["status"]),
            cause: nullableString(json["cause"])
        };
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
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
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
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
        const multipart: Record<string, string | number | boolean | null | undefined> = {
            id: galleryId,
            no: options.articleId
        };

        if (session.user.type === "anonymous") {
            multipart["password"] = session.user.password;
        }

        const raw = await postMultipartJson(this.http, API_URL.article.modify, multipart);
        const json = firstObject(raw);

        return {
            result: booleanValue(json["result"]),
            galleryId: nullableString(json["gall_id"]),
            articleId: numberValue(json["gall_no"]),
            fileCount: numberValue(json["file_cnt"]),
            fileSize: numberValue(json["file_size"]),
            subject: nullableString(json["subject"]),
            content: mapModifyContent(json["memo"]),
            files: arrayValue(json["file"]).map((file) => {
                const values = Object.values(objectValue(file));
                return {
                    block: numberValue(values[0]),
                    fileSize: numberValue(values[1])
                };
            }),
            headTexts: mapHeadTexts(json["head_text"]),
            currentHeadText: nullableString(json["headtext"]),
            cause: nullableString(json["cause"])
        };
    }

    private async listWithAppId(
        options: ArticleListOptions,
        retryOnRefresh: boolean
    ): Promise<ArticleListResult> {
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
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

        return {
            gallery: mapGalleryInfo(firstObject(root["gall_info"])),
            articles: arrayValue(root["gall_list"]).map((item) => mapArticleListItem(objectValue(item))),
            raw
        };
    }

    private async readWithAppId(
        options: ArticleReadOptions,
        retryOnRefresh: boolean
    ): Promise<ArticleReadResult> {
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
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

        return {
            info: mapArticleViewInfo(objectValue(root["view_info"])),
            main: mapArticleViewMain(objectValue(root["view_main"])),
            raw
        };
    }

    private async vote(url: string, options: ArticleVoteOptions): Promise<ArticleVoteResult> {
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
        const json = await this.uploadArticleAction(url, {
            id: galleryId,
            no: options.articleId
        });

        return {
            result: booleanValue(json["result"]),
            cause: nullableString(json["cause"]),
            member: nullableNumber(json["member"])
        };
    }

    /** 추천/비추천/삭제 등 multipart POST 액션의 공용 전송+에러 처리. */
    private async uploadArticleAction(
        url: string,
        multipart: Record<string, string | number | boolean | Blob | File | null | undefined>
    ): Promise<Record<string, unknown>> {
        const raw = await postMultipartJson(this.http, url, multipart);
        const json = firstObject(raw);
        if (isApiError(json)) throw apiError("complete article action", json);
        return json;
    }

    /** 세션이 필요한 작업에서 세션을 가져오거나 에러를 던진다. */
    private requireSession(action: string): Session {
        const session = this.getSession();
        if (!session) {
            throw new Error(`A session is required to ${action}. Call client.login(...) or client.useAnonymous(...).`);
        }
        return session;
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

function mapModifyContent(value: unknown): ArticleContent[] {
    return arrayValue(value).flatMap((block) => {
        const object = objectValue(block);
        const tagValue = object["tag_value"];

        return Object.entries(object)
            .filter(([key]) => key !== "tag_value")
            .map(([, entry]) => {
                const decoded = decodeHtml(stringValue(entry));
                return {
                    type: "html" as const,
                    html: tagValue == null ? decoded : `<img src="${decoded}">`
                };
            });
    });
}

function mapHeadTexts(value: unknown): HeadText[] {
    return arrayValue(value).map((item) => {
        const object = objectValue(item);
        return {
            no: numberValue(object["no"]),
            name: stringValue(object["name"]),
            level: numberValue(object["level"]),
            selected: booleanValue(object["selected"])
        };
    });
}

function mapGalleryInfo(gallInfo: Record<string, unknown>): GalleryInfo {
    return {
        title: stringValue(gallInfo["gall_title"]),
        category: numberValue(gallInfo["category"]),
        fileCount: numberValue(gallInfo["file_cnt"]),
        fileSize: numberValue(gallInfo["file_size"]),
        noWrite: booleanValue(gallInfo["no_write"]),
        captcha: nullableBoolean(gallInfo["captcha"]),
        codeCount: nullableNumber(gallInfo["code_count"]),
        isMinor: booleanValue(gallInfo["is_minor"]),
        isMini: booleanValue(gallInfo["is_mini"]),
        isManager: booleanValue(gallInfo["managerskill"]),
        membership: nullableBoolean(gallInfo["membership"]),
        profileImage: nullableString(gallInfo["profile_img"]),
        totalMember: nullableNumber(gallInfo["total_member"]),
        memberJoin: nullableBoolean(gallInfo["member_join"]),
        useAutoDelete: nullableNumber(gallInfo["use_auto_delete"]),
        useListFix: nullableYnBoolean(gallInfo["use_list_fix"]),
        notifyRecent: nullableNumber(gallInfo["notify_recent"]),
        relationGallery: objectValue(gallInfo["relation_gall"]) as Record<string, string>,
        headTexts: mapHeadTexts(gallInfo["head_text"])
    };
}

function mapArticleListItem(item: Record<string, unknown>): ArticleListItem {
    return {
        id: numberValue(item["no"]),
        views: numberValue(item["hit"]),
        upvotes: numberValue(item["recommend"]),
        hasImage: ynBoolean(item["img_icon"]),
        hasUpvoteIcon: ynBoolean(item["recommend_icon"]),
        isBest: ynBoolean(item["best_chk"]),
        hasVoice: ynBoolean(item["voice_icon"]),
        hasWinnerta: ynBoolean(item["winnerta_icon"]),
        level: numberValue(item["level"]),
        commentCount: numberValue(item["total_comment"]),
        voiceCount: numberValue(item["total_voice"]),
        userId: stringValue(item["user_id"]),
        memberIcon: numberValue(item["member_icon"]),
        ip: stringValue(item["ip"]),
        gallerCon: nullableString(item["gallercon"]),
        subject: stringValue(item["subject"]),
        name: stringValue(item["name"]),
        dateTime: stringValue(item["date_time"]),
        headText: nullableString(item["head_text"])
    };
}

function mapArticleViewInfo(viewInfo: Record<string, unknown>): ArticleViewInfo {
    return {
        galleryTitle: stringValue(viewInfo["galltitle"]),
        category: numberValue(viewInfo["category"]),
        subject: stringValue(viewInfo["subject"]),
        id: numberValue(viewInfo["no"]),
        name: stringValue(viewInfo["name"]),
        level: numberValue(viewInfo["level"]),
        memberIcon: numberValue(viewInfo["member_icon"]),
        commentCount: numberValue(viewInfo["total_comment"]),
        ip: stringValue(viewInfo["ip"]),
        hasImage: ynBoolean(viewInfo["img_chk"]),
        hasRecommend: ynBoolean(viewInfo["recommend_chk"]),
        hasWinnerta: ynBoolean(viewInfo["winnerta_chk"]),
        hasVoice: ynBoolean(viewInfo["voice_chk"]),
        views: numberValue(viewInfo["hit"]),
        writeType: stringValue(viewInfo["write_type"]),
        userId: stringValue(viewInfo["user_id"]),
        previousId: numberValue(viewInfo["prev_link"]),
        previousSubject: stringValue(viewInfo["prev_subject"]),
        headTitle: stringValue(viewInfo["headtitle"]),
        nextId: numberValue(viewInfo["next_link"]),
        nextSubject: stringValue(viewInfo["next_subject"]),
        isBest: ynBoolean(viewInfo["best_chk"]),
        isNotice: ynBoolean(viewInfo["isNotice"]),
        gallerCon: nullableString(viewInfo["gallercon"]),
        dateTime: stringValue(viewInfo["date_time"]),
        isMinor: booleanValue(viewInfo["is_minor"]),
        isMini: booleanValue(viewInfo["is_mini"]),
        useAutoDelete: nullableNumber(viewInfo["use_auto_delete"]),
        useListFix: nullableYnBoolean(viewInfo["use_list_fix"]),
        membership: nullableBoolean(viewInfo["membership"]),
        memberGrant: nullableNumber(viewInfo["member_grant"]),
        headTexts: mapHeadTexts(viewInfo["head_text"]),
        commentDeleteScope: booleanValue(viewInfo["commentDel_scope"])
    };
}

function mapArticleViewMain(viewMain: Record<string, unknown>): ArticleViewMain {
    return {
        content: stringValue(viewMain["memo"]),
        upvotes: numberValue(viewMain["recommend"]),
        memberUpvotes: numberValue(viewMain["recommend_member"]),
        downvotes: numberValue(viewMain["nonrecommend"]),
        isManager: booleanValue(viewMain["managerskill"])
    };
}
