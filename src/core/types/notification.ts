/** 알림 API 공통 응답입니다. */
export interface NotificationResult {
    /** 요청 성공 여부입니다. */
    result: boolean;
    /** 서버가 반환한 cause/message입니다. */
    cause: string | null;
    /** 서버 원본 응답입니다. */
    raw: unknown;
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
    page?: number;
}

/** 알림 구독 목록의 한 항목입니다. 게시글 알림 구독 정보를 나타냅니다. */
export interface ArticleNotificationSubscription {
    galleryId: string;
    galleryName: string;
    postNo: string;
    subject: string;
    nickname: string;
    writeTime?: string;
}

/** 이용자 구독 알림 항목입니다. */
export interface UserNotificationSubscription {
    galleryId: string;
    galleryName: string;
    userId: string;
    nickname: string;
    memberIcon?: number;
}

/** 키워드 알림 구독 항목입니다. */
export interface KeywordNotificationSubscription {
    galleryId: string;
    galleryName: string;
    keyword: string;
}

/** 갤러리 범위 알림 구독 항목입니다. 개념글/공지 알림에 사용합니다. */
export interface GalleryNotificationSubscription {
    galleryId: string;
    galleryName: string;
}

/** 알림(알람) 종류입니다. 알림 발생 경로에 따라 구분합니다. */
export type AlarmType = "post_replied" | "post_notified" | "keyword" | "recommend" | "notice" | "unknown";

/** 서버 알림(알람) 항목입니다. `alarmList` 조회 결과를 파싱한 값입니다. */
export interface AlarmItem {
    /** 알림 고유 식별자입니다. 클라이언트에서 생성한 합성 ID입니다. */
    id: string;
    /** 알림 종류입니다. */
    type: AlarmType;
    /** 갤러리 ID입니다. */
    galleryId: string;
    /** 갤러리 이름입니다. */
    galleryName?: string;
    /** 게시글 번호입니다. */
    postNo: string;
    /** 댓글 번호입니다. 댓글 알림이 아닌 경우 빈 문자열입니다. */
    commentNo: string;
    /** 게시글 제목 접두사(말머리)입니다. */
    postTitlePrefix?: string;
    /** 게시글 제목입니다. */
    postTitle?: string;
    /** 작성자 닉네임입니다. */
    authorName?: string;
    /** 작성자 IP입니다. */
    authorIp?: string;
    /** 작성자 고유 ID입니다. */
    authorId?: string;
    /** 작성자 회원 아이콘 번호입니다. */
    memberIcon?: number;
    /** 알림 표시 제목입니다. */
    title: string;
    /** 알림 본문입니다. */
    body: string;
    /** 알림 생성 시각(epoch ms)입니다. 서버에서 시각 필드를 제공하지 않으면 요청 시점으로 설정됩니다. */
    createdAt: number;
    /** 읽음 여부입니다. 서버에서 상태를 제공하지 않으면 `false`입니다. */
    read: boolean;
}

/** 게시글 알림 구독 목록 응답입니다. */
export interface ArticleNotificationListResult {
    subscriptions: ArticleNotificationSubscription[];
    raw: unknown;
}

/** 이용자 구독 알림 목록 응답입니다. */
export interface UserNotificationListResult {
    subscriptions: UserNotificationSubscription[];
    raw: unknown;
}

/** 키워드 알림 목록 응답입니다. */
export interface KeywordNotificationListResult {
    subscriptions: KeywordNotificationSubscription[];
    raw: unknown;
}

/** 개념글/공지 알림 목록 응답입니다. */
export interface GalleryNotificationListResult {
    subscriptions: GalleryNotificationSubscription[];
    raw: unknown;
}

/** 알림(알람) 목록 응답입니다. */
export interface AlarmListResult {
    items: AlarmItem[];
    raw: unknown;
}