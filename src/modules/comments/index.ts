import type {AuthManager} from "../../core/auth";
import {type KyHttpClient, postMultipartJson} from "../../core/http";
import {apiError, isApiError, shouldRefreshAppId} from "../../core/http/api-error";
import {API_URL} from "../../core/http/constants";
import {
    arrayValue,
    booleanValue,
    firstObject,
    nullableString,
    numberValue,
    objectValue,
    stringValue
} from "../../core/http/json";
import type {
    CommentContent,
    CommentData,
    CommentDeleteOptions,
    CommentDeleteResult,
    CommentReadOptions,
    CommentReadResult,
    CommentWriteOptions,
    Session,
    WriteResult
} from "../../core/types";

export type ArticleCommentScopedOptions<T extends {
    gallery: string;
    articleId: number
}> = Omit<T, "gallery" | "articleId">;

/**
 * 댓글 목록 조회, 작성, 대댓글 작성, 삭제 흐름을 처리합니다.
 */
export class CommentManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly auth: AuthManager,
        private readonly getSession: () => Session | null
    ) {
    }

    article(gallery: string, articleId: number): ScopedArticleCommentManager {
        return new ScopedArticleCommentManager(this, gallery, articleId);
    }

    /**
     * 게시글의 댓글 목록을 불러옵니다.
     *
     * @param options 갤러리 ID, 게시글 번호, 댓글 페이지 번호입니다.
     * @returns 페이지 정보와 댓글 목록입니다.
     */
    async list(options: CommentReadOptions): Promise<CommentReadResult> {
        return this.listWithAppId(options, true);
    }

    /**
     * 게시글에 댓글을 작성합니다.
     *
     * @param options 갤러리 ID, 게시글 번호, 댓글 본문입니다.
     * @returns 작성 성공 여부와 서버 응답 정보입니다.
     */
    async write(options: CommentWriteOptions): Promise<WriteResult> {
        return this.send(options, "com_write");
    }

    /**
     * 기존 댓글에 대댓글을 작성합니다.
     *
     * @param options 갤러리 ID, 게시글 번호, 부모 댓글 번호, 대댓글 본문입니다.
     * @returns 작성 성공 여부와 서버 응답 정보입니다.
     */
    async reply(options: CommentWriteOptions & { replyToCommentId: number }): Promise<WriteResult> {
        return this.send(options, "com_reple");
    }

    /**
     * 댓글을 삭제합니다.
     *
     * @param options 갤러리 ID, 게시글 번호, 삭제할 댓글 번호입니다.
     * @returns 삭제 성공 여부와 서버 메시지입니다.
     */
    async delete(options: CommentDeleteOptions): Promise<CommentDeleteResult> {
        const session = this.requireSession("delete comments");
        const galleryId = options.gallery;
        const multipart: Record<string, string | number | boolean | null | undefined> = {
            id: galleryId,
            no: options.articleId,
            comment_no: options.commentId,
            mode: "comment_del"
        };

        if (session.user.type === "anonymous") {
            multipart["comment_pw"] = session.user.password;
            multipart["board_id"] = "";
        } else {
            multipart["board_id"] = session.user.id;
            if (session.detail) multipart["user_id"] = session.detail.userId;
        }

        const raw = await postMultipartJson(this.http, API_URL.comment.delete, multipart);
        const json = firstObject(raw);
        if (isApiError(json)) throw apiError("delete comment", json);

        return {
            result: booleanValue(json["result"]),
            cause: nullableString(json["cause"])
        };
    }

    private async listWithAppId(
        options: CommentReadOptions,
        retryOnRefresh: boolean
    ): Promise<CommentReadResult> {
        const galleryId = options.gallery;
        const url = new URL(API_URL.comment.read);
        url.searchParams.set("id", galleryId);
        url.searchParams.set("no", String(options.articleId));
        url.searchParams.set("re_page", String(options.page ?? 1));

        const raw = await this.http.ky.get(url.toString()).json();
        const root = firstObject(raw);
        if (isApiError(root)) {
            if (retryOnRefresh && shouldRefreshAppId(root)) {
                await this.auth.refreshAppId({refreshClientToken: true});
                return this.listWithAppId(options, false);
            }
            throw apiError("load comments", root);
        }

        return {
            totalComments: numberValue(root["total_comment"]),
            totalPages: numberValue(root["total_page"]),
            page: numberValue(root["re_page"]),
            comments: arrayValue(root["comment_list"]).map((comment) => mapComment(objectValue(comment)))
        };
    }

    /** 댓글과 대댓글 작성 요청을 공통 형식으로 전송합니다. */
    private async send(options: CommentWriteOptions, mode: "com_write" | "com_reple"): Promise<WriteResult> {
        const session = this.requireSession("write comments");
        const galleryId = options.gallery;
        const content = normalizeContent(options.content);
        const multipart: Record<string, string | number | boolean | null | undefined> = {
            id: galleryId,
            no: options.articleId,
            mode
        };

        if (mode === "com_reple") {
            multipart["reple_id"] = "";
            multipart["comment_no"] = options.replyToCommentId;
        }

        if (content.type === "text") {
            multipart["comment_memo"] = content.memo;
        } else {
            multipart["comment_memo"] = content.dccon.imgLink
                ? `<img src='${content.dccon.imgLink}' class='written_dccon' alt='0' conalt='0' title='${content.dccon.memo ?? ""}'>`
                : "";
            multipart["detail_idx"] = content.dccon.detailIndex;
        }

        if (session.user.type === "anonymous") {
            multipart["comment_nick"] = session.user.id;
            multipart["comment_pw"] = session.user.password;
        } else {
            multipart["board_id"] = session.user.id;
            if (session.detail) multipart["user_id"] = session.detail.userId;
        }

        const raw = await postMultipartJson(this.http, API_URL.comment.ok, multipart);
        const json = firstObject(raw);
        if (isApiError(json)) throw apiError("write comment", json);

        return {
            result: booleanValue(json["result"]),
            data: json["data"] == null ? null : numberValue(json["data"]),
            cause: nullableString(json["cause"]),
            word: nullableString(json["word"])
        };
    }

    /** 세션이 필요한 작업에서 현재 세션을 가져오거나 에러를 던집니다. */
    private requireSession(action: string): Session {
        const session = this.getSession();
        if (!session) {
            throw new Error(`A session is required to ${action}. Call client.login(...) or client.useAnonymous(...).`);
        }
        return session;
    }
}

export class ScopedArticleCommentManager {
    constructor(
        private readonly manager: CommentManager,
        private readonly gallery: string,
        private readonly articleId: number
    ) {
    }

    list(options: ArticleCommentScopedOptions<CommentReadOptions> = {}): Promise<CommentReadResult> {
        return this.manager.list({...options, gallery: this.gallery, articleId: this.articleId});
    }

    write(options: ArticleCommentScopedOptions<CommentWriteOptions>): Promise<WriteResult> {
        return this.manager.write({...options, gallery: this.gallery, articleId: this.articleId});
    }

    reply(
        options: ArticleCommentScopedOptions<CommentWriteOptions> & { replyToCommentId: number }
    ): Promise<WriteResult> {
        return this.manager.reply({...options, gallery: this.gallery, articleId: this.articleId});
    }

    delete(options: ArticleCommentScopedOptions<CommentDeleteOptions>): Promise<CommentDeleteResult> {
        return this.manager.delete({...options, gallery: this.gallery, articleId: this.articleId});
    }
}

function normalizeContent(content: CommentContent | string): CommentContent {
    return typeof content === "string" ? {type: "text", memo: content} : content;
}

function mapComment(comment: Record<string, unknown>): CommentData {
    return {
        memberIcon: numberValue(comment["member_icon"]),
        ip: nullableString(comment["ipData"]),
        gallerCon: nullableString(comment["gallercon"]),
        name: stringValue(comment["name"]),
        userId: stringValue(comment["user_id"]),
        content: mapContent(comment),
        id: numberValue(comment["comment_no"]),
        dateTime: stringValue(comment["date_time"]),
        isReply: booleanValue(comment["under_step"]),
        deleteFlag: nullableString(comment["is_delete_flag"])
    };
}

function mapContent(comment: Record<string, unknown>): CommentContent {
    const dccon = nullableString(comment["dccon"]);
    if (!dccon) {
        return {
            type: "text",
            memo: stringValue(comment["comment_memo"])
        };
    }

    return {
        type: "dccon",
        dccon: {
            imgLink: dccon,
            memo: stringValue(comment["comment_memo"]),
            detailIndex: numberValue(comment["dccon_detail_idx"])
        }
    };
}