import type {AuthManager} from "../auth";
import {type KyHttpClient, postMultipartJson} from "../http";
import {apiError, isApiError, shouldRefreshAppId} from "../http/api-error";
import {API_URL} from "../http/constants";
import {normalizeGalleryId} from "../http/gallery-id";
import {
    arrayValue,
    booleanValue,
    firstObject,
    nullableString,
    numberValue,
    objectValue,
    stringValue
} from "../http/json";
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
} from "../types";

/**
 * 댓글 매니저. 댓글 목록/작성/대댓글/삭제 흐름을 다룬다.
 */
export class CommentManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly auth: AuthManager,
        private readonly getSession: () => Session | null
    ) {
    }

    /** 댓글 목록을 불러온다. app_id 만료 시 자동 갱신 후 재시도. */
    async list(options: CommentReadOptions): Promise<CommentReadResult> {
        return this.listWithAppId(options, true);
    }

    /** 댓글을 작성한다. 세션 필요. */
    async write(options: CommentWriteOptions): Promise<WriteResult> {
        return this.send(options, "com_write");
    }

    /** 대댓글을 작성한다. replyToCommentId 필수. 세션 필요. */
    async reply(options: CommentWriteOptions & { replyToCommentId: number }): Promise<WriteResult> {
        return this.send(options, "com_reple");
    }

    /** 댓글을 삭제한다. 세션 필요. */
    async delete(options: CommentDeleteOptions): Promise<CommentDeleteResult> {
        const session = this.requireSession("delete comments");
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
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
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
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

    /** 댓글/대댓글 작성 공용 전송. */
    private async send(options: CommentWriteOptions, mode: "com_write" | "com_reple"): Promise<WriteResult> {
        const session = this.requireSession("write comments");
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);
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

    /** 세션이 필요한 작업에서 세션을 가져오거나 에러를 던진다. */
    private requireSession(action: string): Session {
        const session = this.getSession();
        if (!session) {
            throw new Error(`A session is required to ${action}. Call client.login(...) or client.useAnonymous(...).`);
        }
        return session;
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