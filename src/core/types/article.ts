import type {CaptchaAnswer} from "./captcha";
import type {GalleryInfo, GalleryTarget, HeadText} from "./gallery";

export type ArticleListOptions = GalleryTarget & {
    /** 1부터 시작하는 페이지 번호. 생략하면 `1`입니다. */
    page?: number;
    /** 검색어. 생략하면 일반 목록을 조회합니다. */
    searchKeyword?: string;
    /** 검색 대상. `searchKeyword`와 함께 사용하며 생략하면 `all`입니다. */
    searchType?: "all" | "subject" | "memo" | "name" | "subject_m";
    /** 추천글만 조회할지 여부입니다. */
    recommend?: boolean;
    /** 공지만 조회할지 여부입니다. */
    notice?: boolean;
    /** 말머리 ID 필터입니다. */
    headId?: number;
};

export interface ArticleListItem {
    id: number;
    headNumber: number;
    views: number;
    upvotes: number;
    hasImage: boolean;
    hasMovie: boolean;
    hasUpvoteIcon: boolean;
    isBest: boolean;
    isRealtime: boolean;
    isRealtimeLatest: boolean;
    hasVoice: boolean;
    hasWinnerta: boolean;
    level: number;
    commentCount: number;
    voiceCount: number;
    userId: string;
    memberIcon: number;
    ip: string;
    gallerCon: string | null;
    subject: string;
    name: string;
    dateTime: string;
    headText: string | null;
}

export interface ArticleListResult {
    gallery: GalleryInfo;
    articles: ArticleListItem[];
}

export type ArticleReadOptions = GalleryTarget & {
    /** 게시글 번호. DCInside API의 `no` 값입니다. */
    articleId: number;
};

export interface ArticleViewInfo {
    galleryTitle: string;
    category: number;
    subject: string;
    id: number;
    name: string;
    level: number;
    memberIcon: number;
    commentCount: number;
    ip: string;
    hasImage: boolean;
    hasRecommend: boolean;
    hasWinnerta: boolean;
    hasVoice: boolean;
    views: number;
    writeType: string;
    userId: string;
    previousId: number;
    previousSubject: string;
    headTitle: string;
    headId: number | null;
    nextId: number;
    nextSubject: string;
    isBest: boolean;
    isRealtimeLatest: boolean;
    isNotice: boolean;
    alarmFlag: number | null;
    gallerCon: string | null;
    dateTime: string;
    isMinor: boolean;
    isMini: boolean;
    isPerson: boolean;
    useAutoDelete: number | null;
    useListFix: boolean | null;
    membership: boolean | null;
    memberGrant: number | null;
    commentCaptcha: boolean | null;
    commentCodeCount: number | null;
    recommendCaptcha: boolean | null;
    recommendCaptchaType: string | null;
    recommendCodeCount: number | null;
    anonymousNickname: string | null;
    captureNickname: string | null;
    galleryNickname: string | null;
    profileImage: string | null;
    headTexts: HeadText[];
    commentDeleteScope: boolean;
}

export interface ArticleViewMain {
    content: string;
    upvotes: number;
    memberUpvotes: number;
    downvotes: number;
    nonrecommendEnabled: boolean | null;
    isManager: boolean;
}

export interface ArticleReadResult {
    info: ArticleViewInfo;
    main: ArticleViewMain;
}

export type ArticleContent =
/** 일반 텍스트 블록. HTML 이스케이프 후 `<div>`로 감싸 전송합니다. */
    | string
    | {
    /** 일반 텍스트 블록. HTML 이스케이프 후 `<div>`로 감싸 전송합니다. */
    type: "text";
    /** 이 블록에 들어갈 텍스트입니다. */
    text: string;
}
    | {
    /** 원본 HTML 블록. 신뢰한 HTML에만 사용하세요. */
    type: "html";
    /** 하나의 memo block으로 전송할 HTML입니다. */
    html: string;
}
    | {
    /** Markdown 형태의 텍스트 블록. 현재는 렌더링하지 않고 이스케이프된 텍스트로 전송합니다. */
    type: "markdown";
    /** 이스케이프된 텍스트로 전송할 Markdown 원문입니다. */
    markdown: string;
}
    | {
    /** 업로드 이미지 블록입니다. */
    type: "image";
    /** 첨부할 이미지 Blob/File입니다. */
    file: Blob | File;
    /** 호출 측에서 MIME 메타데이터를 보관해야 할 때 사용할 수 있는 값입니다. */
    mimeType?: string;
}
    | {
    /** `client.dccons.insert(...)`로 발급받은 디시콘 블록입니다. */
    type: "dccon";
    /** 디시콘 삽입 API가 반환한 `imageTag` 값입니다. */
    imageTag: string;
    /** 디시콘 상세 인덱스입니다. */
    detailIndex: number;
};

export type ArticleWriteOptions = GalleryTarget & {
    /** 게시글 제목. 공백뿐이면 요청 전에 거부합니다. */
    subject: string;
    /** 순서대로 전송할 본문 블록. 최소 한 개가 필요합니다. */
    content: ArticleContent[];
    /** 기존 게시글 번호. `mode`가 `modify`이면 필수입니다. */
    articleId?: number;
    /** 말머리가 필요하거나 지원되는 갤러리에서 선택한 말머리입니다. */
    headText?: Pick<HeadText, "no" | "name">;
    /** 새 글 작성 또는 기존 글 수정 모드. 생략하면 `write`입니다. */
    mode?: "write" | "modify";
    /** 캡챠(보안코드) 답변입니다. 서버가 캡챠를 요구할 때 전달합니다. */
    captcha?: CaptchaAnswer;
    /** 성인 인증 코드입니다. 성인 갤러리 글 작성 시 필요할 수 있습니다. */
    adultCode?: string;
};

export type ArticleWriteResult =
    | {
    result: true;
    articleId: number;
    galleryId: string | null;
    cause: string | null;
}
    | {
    result: false;
    articleId: null;
    galleryId: null;
    cause: string;
};

export type ArticleDeleteOptions = GalleryTarget & {
    articleId: number;
};

export interface ArticleDeleteResult {
    result: boolean;
    cause: string | null;
    message: string | null;
    status: number | null;
}

export type ArticleVoteOptions = GalleryTarget & {
    articleId: number;
    /** 캡챠(보안코드) 답변입니다. 서버가 캡챠를 요구할 때 전달합니다. */
    captcha?: CaptchaAnswer;
};

export interface ArticleVoteResult {
    result: boolean;
    cause: string | null;
    member: number | null;
}

export type ArticleModifyInfoOptions = GalleryTarget & {
    articleId: number;
};

export interface ArticleModifyInfoResult {
    result: boolean;
    galleryId: string | null;
    articleId: number;
    fileCount: number;
    fileSize: number;
    subject: string | null;
    content: ArticleContent[];
    files: Array<{ block: number; fileSize: number }>;
    headTexts: HeadText[];
    currentHeadText: string | null;
    cause: string | null;
}