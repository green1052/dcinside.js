import type {MultipartValue} from "../http";

/** 알림 API 공통 응답 원본입니다. */
export interface NotificationResult {
    result: boolean;
    cause: string | null;
    message?: string;
}

/** 댓글 알림 토글 입력입니다. 댓글 알림 해제는 댓글 삭제와 동일 엔드포인트를 쓰므로 미지원합니다. */
export interface CommentNotificationOptions {
    galleryId: string;
    postNo: string;
    commentNo: string;
    enable: boolean;
    boardId?: string;
    bestCheck?: string;
    bestCommentId?: string;
    bestCommentNo?: string;
}

/** 마이너 갤러리 알림 입력입니다. */
export interface MinorNotificationOptions {
    galleryId: string;
    postNo: string;
}

/** 게시글 알림 토글 입력입니다. `enable`이 `true`일 때만 추가 필드가 필요합니다. */
export type ArticleNotificationOptions = MinorNotificationOptions & (
    | { enable: true; galleryName: string; nickname: string; subject: string; writeTime?: string }
    | { enable: false }
    );

/** 이용자 구독 알림 토글 입력입니다. */
export interface UserNotificationOptions {
    enable: boolean;
    galleryId: string;
    galleryName?: string;
    writerUserId?: string;
    nickname?: string;
}

/** 갤러리 범위 알림 입력입니다. */
export interface GalleryNotificationOptions {
    galleryId: string;
    galleryName?: string;
}

/** 키워드 알림 입력입니다. */
export interface KeywordNotificationOptions extends GalleryNotificationOptions {
    keyword: string;
}

/** 알림 목록 조회 입력입니다. */
export interface GalleryScopedNotificationListOptions {
    galleryId?: string;
    type?: "I" | "U";
    page?: number;
}

/** 알림(알람) 목록 조회 입력입니다. */
export interface AlarmNotificationListOptions {
    /** `I`는 내 글/댓글 알림, `U`는 구독한 게시글 알림입니다. 기본값은 `I`입니다. */
    type?: "I" | "U";
    page?: number;
}

/** 게시글 알림 구독 항목 원본입니다. 후보 키들이 섞여 있어 모두 optional입니다. */
export interface ArticleNotificationSubscription {
    id?: string;
    gallery_id?: string;
    gall_id?: string;
    ko_name?: string;
    gall_ko_name?: string;
    no?: string;
    content_no?: string;
    subject?: string;
    title?: string;
    nickname?: string;
    writer_nick?: string;
    write_time?: string;
    regdate?: string;
}

/** 이용자 구독 알림 항목 원본입니다. */
export interface UserNotificationSubscription {
    id?: string;
    gallery_id?: string;
    gall_id?: string;
    ko_name?: string;
    gall_ko_name?: string;
    user_id?: string;
    nickname?: string;
    writer_nick?: string;
    member_icon?: number;
}

/** 키워드 알림 구독 항목 원본입니다. */
export interface KeywordNotificationSubscription {
    id?: string;
    gallery_id?: string;
    gall_id?: string;
    ko_name?: string;
    gall_ko_name?: string;
    keyword?: string;
}

/** 갤러리 범위 알림 구독 항목 원본입니다. 개념글/공지 알림에 사용합니다. */
export interface GalleryNotificationSubscription {
    id?: string;
    gallery_id?: string;
    gall_id?: string;
    ko_name?: string;
    gall_ko_name?: string;
}

/** 서버 알림(알람) 항목 원본입니다. 공식 앱(5.3.6) `api/alarm/message` 응답 모델 기준입니다. */
export interface AlarmItem {
    idx?: string;
    title?: string;
    message?: string;
    gallery_id?: string;
    gall_ko_name?: string;
    content_no?: string;
    comment_no?: number;
    comment_content?: string;
    comment_nick?: string;
    comment_cnt?: number;
    writer_nick?: string;
    alarm_type?: string;
    type?: "I" | "U";
    user_id?: string;
    ip?: string;
    regdate?: string;
}

/** 게시글 알림 구독 목록 응답 원본입니다. `lists`/`list`/`data` 중 하나에 배열이 들어갑니다. */
export interface ArticleNotificationListResult {
    lists?: ArticleNotificationSubscription[];
    list?: ArticleNotificationSubscription[];
    data?: ArticleNotificationSubscription[];
    [key: string]: unknown;
}

/** 이용자 구독 알림 목록 응답 원본입니다. */
export interface UserNotificationListResult {
    lists?: UserNotificationSubscription[];
    list?: UserNotificationSubscription[];
    data?: UserNotificationSubscription[];
    [key: string]: unknown;
}

/** 키워드 알림 목록 응답 원본입니다. */
export interface KeywordNotificationListResult {
    lists?: KeywordNotificationSubscription[];
    list?: KeywordNotificationSubscription[];
    data?: KeywordNotificationSubscription[];
    [key: string]: unknown;
}

/** 개념글/공지 알림 목록 응답 원본입니다. */
export interface GalleryNotificationListResult {
    lists?: GalleryNotificationSubscription[];
    list?: GalleryNotificationSubscription[];
    data?: GalleryNotificationSubscription[];
    [key: string]: unknown;
}

/** 알림(알람) 목록 응답 원본입니다. `lists` 배열에 알림 항목이 들어갑니다. */
export interface AlarmListResult {
    lists?: AlarmItem[];
    [key: string]: unknown;
}