import type {AuthManager} from "../core/auth";
import {type KyHttpClient, postMultipartJson} from "../core/http";
import {API_URL} from "../core/http/constants";
import {numberValue} from "../core/http/json";
import type {
    AlarmItem,
    AlarmListResult,
    AlarmNotificationListOptions,
    ArticleNotificationListResult,
    ArticleNotificationOptions,
    ArticleNotificationSubscription,
    CommentNotificationOptions,
    GalleryNotificationListResult,
    GalleryNotificationOptions,
    GalleryNotificationSubscription,
    GalleryScopedNotificationListOptions,
    KeywordNotificationListResult,
    KeywordNotificationOptions,
    KeywordNotificationSubscription,
    MinorNotificationOptions,
    NotificationResult,
    UserNotificationListResult,
    UserNotificationOptions,
    UserNotificationSubscription
} from "../core/types";

/**
 * 디시인사이드 알림 API 매니저입니다.
 *
 * 댓글/게시글/이용자/키워드/개념글/공지 알림 등록·해제와 알림 목록 조회를 처리합니다.
 * 모든 요청에는 디바이스 인증(`app_id`, `client_token` 또는 `client_id`)이 필요합니다.
 * `DCInsideClient`가 `app_id`/`client_token`을 자동으로 주입하며, 알림 목록 조회 엔드포인트는
 * `client_id`를 FCM 토큰과 함께 전송해야 합니다.
 */
export class NotificationManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly auth: AuthManager
    ) {
    }

    private get clientId(): string {
        return this.auth.fcmToken ?? "";
    }

    /**
     * 댓글 알림을 등록합니다. 댓글 알림 해제는 댓글 삭제와 동일한 엔드포인트를 사용하므로 지원하지 않습니다.
     *
     * @param input 댓글 알림 입력입니다. `enable`은 `true`여야 합니다.
     * @returns 알림 등록 결과입니다.
     */
    async toggleComment(input: CommentNotificationOptions): Promise<NotificationResult> {
        if (!input.enable) {
            throw new Error("comment notification unregister is not supported; mode=comment_del deletes the comment");
        }
        const fields: Record<string, string | number | boolean | null | undefined> = {
            id: input.galleryId,
            no: input.postNo,
            comment_no: input.commentNo,
            mode: "comment_noti"
        };
        if (input.boardId) fields["board_id"] = input.boardId;
        if (input.bestCheck) fields["best_chk"] = input.bestCheck;
        if (input.bestCommentId) fields["best_comid"] = input.bestCommentId;
        if (input.bestCommentNo) fields["best_comno"] = input.bestCommentNo;
        return this.post(API_URL.notification.comment, fields);
    }

    /**
     * 마이너 갤러리 알림을 등록합니다.
     *
     * @param input 마이너 갤러리 알림 입력입니다.
     * @returns 알림 등록 결과입니다.
     */
    async minorNotification(input: MinorNotificationOptions): Promise<NotificationResult> {
        return this.post(API_URL.notification.minor, {id: input.galleryId, no: input.postNo});
    }

    /**
     * 마이너 갤러리 알림을 확인합니다.
     *
     * @param input 마이너 갤러리 알림 확인 입력입니다.
     * @returns 알림 확인 결과입니다.
     */
    async confirmMinorNotification(input: MinorNotificationOptions): Promise<NotificationResult> {
        return this.post(API_URL.notification.minorConfirm, {id: input.galleryId, no: input.postNo});
    }

    /**
     * 알림(알람) 목록을 조회합니다.
     *
     * @param input 페이지 입력입니다. 생략하면 1페이지를 조회합니다.
     * @returns 알림 항목 목록과 원본 응답입니다.
     */
    async listAlarms(input: AlarmNotificationListOptions = {}): Promise<AlarmListResult> {
        const raw = await postMultipartJson(this.http, API_URL.notification.alarmList, {
            client_token: this.clientId,
            page: String(input.page ?? 1)
        });
        return {items: parseAlarmItems(raw), raw};
    }

    /**
     * 게시글 알림을 등록하거나 해제합니다.
     *
     * @param input 게시글 알림 입력입니다. `enable`에 따라 등록/해제 엔드포인트가 결정됩니다.
     * @returns 알림 토글 결과입니다.
     */
    async toggleArticle(input: ArticleNotificationOptions): Promise<NotificationResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {
            id: input.galleryId,
            no: input.postNo,
            client_id: this.clientId
        };
        if (input.enable) {
            fields["ko_name"] = input.galleryName;
            fields["nickname"] = input.nickname;
            fields["subject"] = input.subject;
            if (input.writeTime) fields["write_time"] = input.writeTime;
            return this.post(API_URL.notification.article, fields);
        }
        fields["article_type"] = "A";
        fields["type"] = "U";
        return this.post(API_URL.notification.articleDelete, fields);
    }

    /**
     * 이용자 구독 알림을 등록하거나 해제합니다.
     *
     * @param input 이용자 알림 입력입니다.
     * @returns 알림 토글 결과입니다.
     */
    async toggleUser(input: UserNotificationOptions): Promise<NotificationResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {
            id: input.galleryId,
            client_id: this.clientId
        };
        if (input.enable) {
            if (input.galleryName) fields["ko_name"] = input.galleryName;
            if (input.writerUserId) fields["user_id"] = input.writerUserId;
            if (input.nickname) fields["nickname"] = input.nickname;
            return this.post(API_URL.notification.user, fields);
        }
        if (input.writerUserId) fields["user_id"] = input.writerUserId;
        return this.post(API_URL.notification.userDelete, fields);
    }

    /**
     * 게시글 알림 구독 목록을 조회합니다.
     *
     * @param input 갤러리 필터와 타입 입력입니다.
     * @returns 게시글 알림 구독 목록과 원본 응답입니다.
     */
    async listArticleSubscriptions(input: GalleryScopedNotificationListOptions = {}): Promise<ArticleNotificationListResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {client_id: this.clientId};
        if (input.type) fields["type"] = input.type;
        if (input.galleryId) fields["id"] = input.galleryId;
        const raw = await postMultipartJson(this.http, API_URL.notification.article, fields);
        return {subscriptions: parseArticleSubscriptions(raw), raw};
    }

    /**
     * 이용자 구독 알림 목록을 조회합니다.
     *
     * @param input 갤러리 필터 입력입니다.
     * @returns 이용자 구독 목록과 원본 응답입니다.
     */
    async listUserSubscriptions(input: GalleryScopedNotificationListOptions = {}): Promise<UserNotificationListResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {client_id: this.clientId};
        if (input.galleryId) fields["id"] = input.galleryId;
        const raw = await postMultipartJson(this.http, API_URL.notification.user, fields);
        return {subscriptions: parseUserSubscriptions(raw), raw};
    }

    /**
     * 키워드 알림 구독 목록을 조회합니다.
     *
     * @param input 갤러리 필터 입력입니다.
     * @returns 키워드 알림 구독 목록과 원본 응답입니다.
     */
    async listKeywordNotifications(input: GalleryScopedNotificationListOptions = {}): Promise<KeywordNotificationListResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {client_id: this.clientId};
        if (input.galleryId) fields["id"] = input.galleryId;
        const raw = await postMultipartJson(this.http, API_URL.notification.keyword, fields);
        return {subscriptions: parseKeywordSubscriptions(raw), raw};
    }

    /**
     * 키워드 알림을 등록하거나 해제합니다.
     *
     * @param input 키워드 알림 입력과 `enable` 플래그입니다.
     * @returns 알림 토글 결과입니다.
     */
    async toggleKeyword(input: KeywordNotificationOptions & { enable: boolean }): Promise<NotificationResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {
            client_id: this.clientId,
            id: input.galleryId,
            keyword: input.keyword
        };
        if (input.galleryName) fields["ko_name"] = input.galleryName;
        return this.post(input.enable ? API_URL.notification.keyword : API_URL.notification.keywordDelete, fields);
    }

    /**
     * 갤러리의 모든 키워드 알림을 해제합니다.
     *
     * @param input 갤러리 알림 입력입니다.
     * @returns 해제 결과입니다.
     */
    async deleteAllKeywords(input: GalleryNotificationOptions): Promise<NotificationResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {
            client_id: this.clientId,
            id: input.galleryId
        };
        if (input.galleryName) fields["ko_name"] = input.galleryName;
        return this.post(API_URL.notification.keywordDeleteAll, fields);
    }

    /**
     * 개념글 알림 구독 목록을 조회합니다.
     *
     * @returns 개념글 알림 구독 목록과 원본 응답입니다.
     */
    async listRecommendNotifications(): Promise<GalleryNotificationListResult> {
        const raw = await postMultipartJson(this.http, API_URL.notification.recommend, {client_id: this.clientId});
        return {subscriptions: parseGallerySubscriptions(raw), raw};
    }

    /**
     * 개념글 알림을 등록하거나 해제합니다.
     *
     * @param input 갤러리 알림 입력과 `enable` 플래그입니다.
     * @returns 알림 토글 결과입니다.
     */
    async toggleRecommend(input: GalleryNotificationOptions & { enable: boolean }): Promise<NotificationResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {
            client_id: this.clientId,
            id: input.galleryId
        };
        if (input.galleryName) fields["ko_name"] = input.galleryName;
        return this.post(input.enable ? API_URL.notification.recommend : API_URL.notification.recommendDelete, fields);
    }

    /**
     * 공지 알림 구독 목록을 조회합니다.
     *
     * @returns 공지 알림 구독 목록과 원본 응답입니다.
     */
    async listNoticeNotifications(): Promise<GalleryNotificationListResult> {
        const raw = await postMultipartJson(this.http, API_URL.notification.notice, {client_id: this.clientId});
        return {subscriptions: parseGallerySubscriptions(raw), raw};
    }

    /**
     * 공지 알림을 등록하거나 해제합니다.
     *
     * @param input 갤러리 알림 입력과 `enable` 플래그입니다.
     * @returns 알림 토글 결과입니다.
     */
    async toggleNotice(input: GalleryNotificationOptions & { enable: boolean }): Promise<NotificationResult> {
        const fields: Record<string, string | number | boolean | null | undefined> = {
            client_id: this.clientId,
            id: input.galleryId
        };
        if (input.galleryName) fields["ko_name"] = input.galleryName;
        return this.post(input.enable ? API_URL.notification.notice : API_URL.notification.noticeDelete, fields);
    }

    /** 알림 엔드포인트로 multipart POST 요청을 보내고 결과를 파싱합니다. */
    private async post(url: string, fields: Record<string, string | number | boolean | null | undefined>): Promise<NotificationResult> {
        const raw = await postMultipartJson(this.http, url, fields);
        const parsed = parseNotificationResult(raw);
        return {...parsed, raw};
    }
}

/** 응답에서 알림 결과를 파싱합니다. 배열이면 첫 번째 요소를 사용합니다. */
function parseNotificationResult(raw: unknown): { result: boolean; cause: string | null } {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === "string") return {result: false, cause: value};
    if (!isObject(value)) return {result: false, cause: "invalid notification response"};
    const result = value.result;
    return {
        result: result === true || result === "true" || result === 1 || result === "1",
        cause: stringField(value, "cause") || stringField(value, "message")
    };
}

/** 알림 목록 응답에서 리스트 부분을 추출합니다. */
function rawList(raw: unknown): Record<string, unknown>[] {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!isObject(value)) return [];
    const list = Array.isArray(value.lists) ? value.lists : Array.isArray(value.list) ? value.list : Array.isArray(value.data) ? value.data : [];
    return list.filter(isObject);
}

/** 알림(알람) 목록 응답을 파싱합니다. `data` 배열의 각 항목을 AlarmItem으로 변환합니다. */
function parseAlarmItems(raw: unknown): AlarmItem[] {
    const value = Array.isArray(raw) ? raw[0] : raw;
    const data = isObject(value) && Array.isArray(value.data) ? value.data : [];
    return data.map(parseAlarmItem).filter((item): item is AlarmItem => item !== null);
}

function parseAlarmItem(raw: unknown): AlarmItem | null {
    if (!isObject(raw)) return null;
    const galleryId = stringField(raw, "id") || stringField(raw, "gallery_id");
    const postNo = stringField(raw, "no") || stringField(raw, "post_no");
    if (!galleryId || !postNo) return null;
    const commentNo = stringField(raw, "comment_no");
    const rawTitle = stringField(raw, "subject") || stringField(raw, "message") || `${galleryId}/${postNo}`;
    const titleParts = parseAlarmTitle(rawTitle);
    const memberIcon = raw["member_icon"];
    const createdAt = parseAlarmTimestamp(raw);
    return {
        id: `server:${galleryId}:${postNo}:${commentNo || "post"}`,
        type: parseAlarmType(raw),
        galleryId,
        postNo,
        commentNo,
        ...(titleParts.prefix ? {postTitlePrefix: titleParts.prefix} : {}),
        ...(titleParts.title ? {postTitle: titleParts.title} : {}),
        authorName: stringField(raw, "name") || undefined,
        ...(raw["ip"] ? {authorIp: stringField(raw, "ip")} : {}),
        ...(raw["user_id"] ? {authorId: stringField(raw, "user_id")} : {}),
        ...(memberIcon != null ? {memberIcon: numberValue(memberIcon)} : {}),
        title: rawTitle,
        body: stringField(raw, "memo") || stringField(raw, "comment_memo") || stringField(raw, "content"),
        createdAt,
        read: parseAlarmReadState(raw)
    };
}

function parseAlarmTitle(raw: string): { prefix?: string; title: string } {
    const match = raw.trim().match(/^(\[[^\]]+\])\s*(.*)$/);
    if (!match) return {title: raw};
    return {prefix: match[1], title: match[2]?.trim() || raw};
}

/** 알림 종류를 응답 필드에서 추론합니다. */
function parseAlarmType(raw: Record<string, unknown>): AlarmItem["type"] {
    const alarmType = stringField(raw, "alarm_type");
    if (alarmType === "U" || alarmType === "post_notified") return "post_notified";
    if (alarmType === "K" || alarmType === "keyword") return "keyword";
    if (alarmType === "R" || alarmType === "recommend") return "recommend";
    if (alarmType === "N" || alarmType === "notice") return "notice";
    if (commentNoExists(raw)) return "post_replied";
    return "unknown";
}

function commentNoExists(raw: Record<string, unknown>): boolean {
    const value = raw["comment_no"];
    return typeof value === "string" ? value.trim().length > 0 : typeof value === "number" && value > 0;
}

/** 알림 생성 시각을 응답에서 파싱합니다. 시각 필드가 없으면 `Date.now()`를 사용합니다. */
function parseAlarmTimestamp(raw: Record<string, unknown>): number {
    const dateStr = stringField(raw, "regdate") || stringField(raw, "write_time") || stringField(raw, "m_time") || stringField(raw, "datetime");
    if (!dateStr) return Date.now();
    const parsed = Date.parse(dateStr);
    return Number.isFinite(parsed) ? parsed : Date.now();
}

/** 알림 읽음 여부를 응답에서 파싱합니다. `is_read`/`read` 필드가 없으면 `false`입니다. */
function parseAlarmReadState(raw: Record<string, unknown>): boolean {
    const value = raw["is_read"] ?? raw["read"];
    if (value == null) return false;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") return value === "Y" || value === "y" || value === "1" || value === "true";
    return value === true;
}

function parseArticleSubscriptions(raw: unknown): ArticleNotificationSubscription[] {
    return rawList(raw).map((item) => ({
        galleryId: stringField(item, "id") || stringField(item, "gallery_id") || stringField(item, "gall_id"),
        galleryName: stringField(item, "ko_name") || stringField(item, "gall_ko_name"),
        postNo: stringField(item, "no") || stringField(item, "content_no"),
        subject: stringField(item, "subject") || stringField(item, "title"),
        nickname: stringField(item, "nickname") || stringField(item, "writer_nick"),
        ...(stringField(item, "write_time") || stringField(item, "regdate") ? {writeTime: stringField(item, "write_time") || stringField(item, "regdate")} : {})
    })).filter((item) => item.galleryId && item.postNo && item.subject && item.nickname);
}

function parseUserSubscriptions(raw: unknown): UserNotificationSubscription[] {
    return rawList(raw).map((item) => {
        const memberIcon = item["member_icon"];
        return {
            galleryId: stringField(item, "id") || stringField(item, "gallery_id") || stringField(item, "gall_id"),
            galleryName: stringField(item, "ko_name") || stringField(item, "gall_ko_name"),
            userId: stringField(item, "user_id"),
            nickname: stringField(item, "nickname") || stringField(item, "writer_nick"),
            ...(typeof memberIcon === "number" ? {memberIcon} : {})
        };
    }).filter((item) => item.galleryId && item.userId && item.nickname);
}

function parseKeywordSubscriptions(raw: unknown): KeywordNotificationSubscription[] {
    return rawList(raw).map((item) => ({
        galleryId: stringField(item, "id") || stringField(item, "gallery_id") || stringField(item, "gall_id"),
        galleryName: stringField(item, "ko_name") || stringField(item, "gall_ko_name"),
        keyword: stringField(item, "keyword")
    })).filter((item) => item.galleryId && item.keyword);
}

function parseGallerySubscriptions(raw: unknown): GalleryNotificationSubscription[] {
    return rawList(raw).map((item) => ({
        galleryId: stringField(item, "id") || stringField(item, "gallery_id") || stringField(item, "gall_id"),
        galleryName: stringField(item, "ko_name") || stringField(item, "gall_ko_name")
    })).filter((item) => item.galleryId);
}

function stringField(value: Record<string, unknown>, key: string): string {
    const field = value[key];
    return typeof field === "string" ? field : typeof field === "number" ? String(field) : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}