import type {AuthManager} from "../core/auth";
import {type KyHttpClient, postMultipartJson} from "../core/http";
import {API_URL} from "../core/http/constants";
import {firstObject} from "../core/http/json";
import type {
    AlarmListResult,
    AlarmNotificationListOptions,
    ArticleNotificationListResult,
    ArticleNotificationOptions,
    CommentNotificationOptions,
    GalleryNotificationListResult,
    GalleryNotificationOptions,
    GalleryScopedNotificationListOptions,
    KeywordNotificationListResult,
    KeywordNotificationOptions,
    MinorNotificationOptions,
    NotificationResult,
    UserNotificationListResult,
    UserNotificationOptions
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
     * @param input 알림 종류(`I`: 내 글/댓글, `U`: 구독 게시글)와 페이지입니다. 기본값은 `I`, 1페이지입니다.
     * @returns `lists`에 알림 항목이 담긴 원본 응답입니다.
     */
    async listAlarms(input: AlarmNotificationListOptions = {}): Promise<AlarmListResult> {
        return this.get(API_URL.notification.message, {type: input.type ?? "I", page: String(input.page ?? 1)});
    }

    /**
     * 알림(알람) 목록을 페이지 단위로 비동기 순회합니다.
     *
     * 각 yield는 한 페이지의 {@link AlarmListResult}입니다. 빈 목록 페이지를 받으면 종료합니다.
     * 시작 페이지는 `input.page`로 지정(기본 1)합니다.
     *
     * @param input 알림 종류와 시작 페이지입니다.
     * @returns 한 페이지 결과를 순차적으로 yield하는 async iterator.
     */
    async *listAlarmsPages(input: AlarmNotificationListOptions = {}): AsyncIterableIterator<AlarmListResult> {
        for (let page = input.page ?? 1; ; page++) {
            const result = await this.listAlarms({...input, page});
            if (!result.lists?.length) return;
            yield result;
        }
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
        return this.get(API_URL.notification.article, {type: input.type, id: input.galleryId});
    }

    /**
     * 이용자 구독 알림 목록을 조회합니다.
     *
     * @param input 갤러리 필터 입력입니다.
     * @returns 이용자 구독 목록과 원본 응답입니다.
     */
    async listUserSubscriptions(input: GalleryScopedNotificationListOptions = {}): Promise<UserNotificationListResult> {
        return this.get(API_URL.notification.user, {id: input.galleryId});
    }

    /**
     * 키워드 알림 구독 목록을 조회합니다.
     *
     * @param input 갤러리 필터 입력입니다.
     * @returns 키워드 알림 구독 목록과 원본 응답입니다.
     */
    async listKeywordNotifications(input: GalleryScopedNotificationListOptions = {}): Promise<KeywordNotificationListResult> {
        return this.get(API_URL.notification.keyword, {id: input.galleryId});
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
        return this.get(API_URL.notification.recommend, {});
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
        return this.get(API_URL.notification.notice, {});
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

    /**
     * 알림 목록 엔드포인트로 GET 요청을 보냅니다. 공식 앱은 같은 URL에 POST하면 등록,
     * GET하면 목록 조회로 사용합니다. 값이 없는 파라미터는 생략합니다.
     */
    private async get<T>(url: string, params: Record<string, string | undefined>): Promise<T> {
        const searchParams = new URLSearchParams({client_id: this.clientId});
        for (const [key, value] of Object.entries(params)) {
            if (value) searchParams.set(key, value);
        }
        return firstObject(await this.http.ky.get(url, {searchParams}).json()) as T;
    }

    /** 알림 엔드포인트로 multipart POST 요청을 보내고 결과를 파싱합니다. */
    private async post(url: string, fields: Record<string, string | number | boolean | null | undefined>): Promise<NotificationResult> {
        const raw = await postMultipartJson(this.http, url, fields);
        return firstObject(raw) as unknown as NotificationResult;
    }
}

