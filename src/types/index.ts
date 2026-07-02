/** 디시인사이드 갤러리 네임스페이스. `mini`와 `person`은 요청 시 접두사를 자동으로 붙입니다. */
export type GalleryType = "main" | "minor" | "mini" | "person";

export type User =
    | {
    type: "anonymous";
    id: string;
    password: string;
}
    | {
    type: "login";
    id: string;
    password: string;
};

export interface SessionDetail {
    result: boolean;
    userId: string;
    userNo: string;
    name: string;
    sessionType: string;
    isAdult: number;
    isDormancy: number;
    isOtp: number;
    pwCampaign: number;
    mailSend: string;
    isGonick: number;
    isSecurityCode: string;
    authChange: number;
    cause: string | null;
}

export interface Session {
    user: User;
    detail: SessionDetail | null;
}

export interface FirebaseInstallation {
    fid: string;
    refreshToken: string;
    authToken: string;
    raw: unknown;
}

export interface AndroidCheckinCredentials {
    androidId: string | number | bigint;
    securityToken: string | number | bigint;
}

export interface ClientTokenResult {
    clientToken: string;
    installation: FirebaseInstallation;
    remoteConfig: unknown;
}

/** 재사용 가능한 디바이스 인증 정보. exportCredentials/importCredentials로 저장/복원한다. */
export interface DeviceCredentials {
    /** Google checkin으로 발급받은 기기 식별값. */
    androidId: string;
    /** Google checkin으로 발급받은 보안 토큰. */
    securityToken: string;
    /** Firebase Installation ID. */
    fid: string;
    /** Firebase Installation refresh token. */
    refreshToken: string;
    /** GCM register3으로 발급받은 FCM client_token. */
    clientToken: string;
    /** DCInside 서버에서 발급받은 app_id. */
    appId: string;
    /** app_id 발급 시각 (epoch ms). */
    appIdIssuedAt: number;
    /** app_check date 캐시 값. */
    appCheckDate: string | null;
    /** app_check 마지막 호출 시각 (epoch ms). */
    lastAppCheckTime: number | null;
}

export interface HeadText {
    no: string | number;
    name: string;
    level: number;
    selected: boolean;
}

export interface Gallery {
    id: string;
    title: string;
    type?: GalleryType;
}

export interface DCCon {
    packageIndex?: number;
    detailIndex: number;
    imgLink?: string;
    memo?: string;
    title?: string;
}

export type CommentContent =
    | {
    type: "text";
    memo: string;
}
    | {
    type: "dccon";
    dccon: DCCon;
};

export interface ArticleListOptions {
    /** 갤러리 ID. `mi$`/`pr$` 접두사가 이미 붙어 있으면 중복으로 붙이지 않습니다. */
    galleryId: string;
    /** 갤러리 네임스페이스. 생략하면 `main`입니다. */
    galleryType?: GalleryType;
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
}

export interface GalleryInfo {
    title: string;
    category: number;
    fileCount: number;
    fileSize: number;
    noWrite: boolean;
    captcha: boolean | null;
    codeCount: number | null;
    isMinor: boolean;
    isMini: boolean;
    isManager: boolean;
    membership: boolean | null;
    profileImage: string | null;
    totalMember: number | null;
    memberJoin: boolean | null;
    useAutoDelete: number | null;
    useListFix: boolean | null;
    notifyRecent: number | null;
    relationGallery: Record<string, string>;
    headTexts: HeadText[];
}

export interface ArticleListItem {
    id: number;
    views: number;
    upvotes: number;
    hasImage: boolean;
    hasUpvoteIcon: boolean;
    isBest: boolean;
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
    raw: unknown;
}

export interface ArticleReadOptions {
    /** 갤러리 ID. */
    galleryId: string;
    /** 갤러리 네임스페이스. 생략하면 `main`입니다. */
    galleryType?: GalleryType;
    /** 게시글 번호. DCInside API의 `no` 값입니다. */
    articleId: number;
}

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
    nextId: number;
    nextSubject: string;
    isBest: boolean;
    isNotice: boolean;
    gallerCon: string | null;
    dateTime: string;
    isMinor: boolean;
    isMini: boolean;
    useAutoDelete: number | null;
    useListFix: boolean | null;
    membership: boolean | null;
    memberGrant: number | null;
    headTexts: HeadText[];
    commentDeleteScope: boolean;
}

export interface ArticleViewMain {
    content: string;
    upvotes: number;
    memberUpvotes: number;
    downvotes: number;
    isManager: boolean;
}

export interface ArticleReadResult {
    info: ArticleViewInfo;
    main: ArticleViewMain;
    raw: unknown;
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

export interface ArticleWriteOptions {
    /** 갤러리 ID. */
    galleryId: string;
    /** 갤러리 네임스페이스. 생략하면 `main`입니다. */
    galleryType?: GalleryType;
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
}

export interface ArticleWriteResult {
    /** 작성/수정 요청 성공 여부입니다. */
    result: boolean;
    /** API가 게시글 번호를 반환한 경우의 새 글 또는 수정 글 번호입니다. */
    articleId: number | null;
    /** 서버가 반환한 cause/message입니다. 일부 성공 응답은 이 필드에 글 번호를 넣습니다. */
    cause: string | null;
    /** API가 반환한 갤러리 ID입니다. */
    galleryId: string | null;
}

export interface ArticleDeleteOptions {
    galleryId: string;
    galleryType?: GalleryType;
    articleId: number;
}

export interface ArticleDeleteResult {
    result: boolean;
    cause: string | null;
    message: string | null;
    status: number | null;
}

export interface ArticleVoteOptions {
    galleryId: string;
    galleryType?: GalleryType;
    articleId: number;
}

export interface ArticleVoteResult {
    result: boolean;
    cause: string | null;
    member: number | null;
}

export interface ArticleModifyInfoOptions {
    galleryId: string;
    galleryType?: GalleryType;
    articleId: number;
}

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

export interface CommentReadOptions {
    galleryId: string;
    galleryType?: GalleryType;
    articleId: number;
    page?: number;
}

export interface CommentData {
    memberIcon: number;
    ip: string | null;
    gallerCon: string | null;
    name: string;
    userId: string;
    content: CommentContent;
    id: number;
    dateTime: string;
    isReply: boolean;
    deleteFlag: string | null;
}

export interface CommentReadResult {
    totalComments: number;
    totalPages: number;
    page: number;
    comments: CommentData[];
}

export interface CommentWriteOptions {
    galleryId: string;
    galleryType?: GalleryType;
    articleId: number;
    content: CommentContent | string;
    replyToCommentId?: number;
}

export interface CommentDeleteOptions {
    galleryId: string;
    galleryType?: GalleryType;
    articleId: number;
    commentId: number;
}

export interface CommentDeleteResult {
    result: boolean;
    cause: string | null;
}

export interface WriteResult {
    result: boolean;
    data: number | null;
    cause: string | null;
    word: string | null;
}

export interface TotalSearchResult {
    mainGallery: Gallery[];
    minorGallery: Gallery[];
    wiki: Array<{ title: string; galleryName: string; url: string }>;
    board: SearchArticle[];
    todayIssue: SearchArticle[];
    realTime: Array<{ rank: number; title: string; url: string }>;
}

export interface SearchArticle {
    title: string;
    content: string;
    galleryId: string;
    galleryName: string;
    articleId: number;
    regDate: string;
}

export interface GallerySearchResult {
    mainGallery: Gallery[];
    minorGallery: Gallery[];
    mainRecommendGallery: Gallery[];
    minorRecommendGallery: Gallery[];
}

export interface DCConListResult {
    tabs: DCCon[];
    list: DCCon[][];
}

export interface DCConInfo {
    packageIndex: number;
    mainImage: string;
    title: string;
    description: string;
    mandu: number;
    getState: boolean;
}

export interface DCConDetailResult {
    info: DCConInfo[];
    detail: DCCon[];
}

export interface DCConInsertResult {
    result: boolean;
    newList: string | null;
    imageSource: string | null;
    alternativeText: string | null;
    imageTag: string | null;
}

export interface DCConBuyResult {
    result: number;
    message: string;
}

export type RankingType = "up" | "down" | "stop" | "unknown";

export interface GalleryRankingItem {
    galleryLink: string;
    galleryId: string;
    galleryName: string;
    rankType: RankingType;
    rank: number;
    rankDelta: number;
}

export interface MinorGalleryInfo {
    id: string;
    koName: string;
    image: string | null;
    description: string | null;
    manager: GalleryManagerInfo;
    subManagers: GalleryManagerInfo[];
    createDate: string;
    isNew: boolean;
    hotState: string;
    totalCount: string;
    categoryName: string;
    mini: MiniGalleryInfo | null;
}

export interface MiniGalleryInfo {
    hide: number;
    totalMember: number;
    memberLimit: number;
    isMember: boolean;
}

export interface GalleryManagerInfo {
    isMaster: boolean;
    id: string;
    name: string;
}

export interface MainPageArticle {
    galleryId: string;
    articleId: number;
    galleryName: string | null;
    title: string;
    thumbnail: string;
}

export interface MainPageResult {
    hit: MainPageArticle[];
    best: MainPageArticle[];
    issueZoom: MainPageArticle[];
    newGallery: Gallery[];
}

export interface MyGalleryResult {
    myGallery: Gallery[];
    favorite: Gallery[];
}

export interface ManagedGallery {
    hide: number;
    id: string;
    title: string;
    type: string;
    managerType: string;
}

export interface JoinedMiniGallery {
    title: string;
    id: string;
    hide: number;
}

export interface JoinedMiniGalleryResult {
    joined: JoinedMiniGallery[];
    pending: JoinedMiniGallery[];
    left: JoinedMiniGallery[];
}

export interface ModifyMyGalleryResult {
    result: boolean;
    cause: string;
}

export interface MiniGalleryJoinResult {
    result: boolean;
    joinQuestion: string;
}

export interface MiniGalleryJoinOkResult {
    result: boolean;
    cause: string;
    status: string;
}

export interface MiniGalleryQuitResult {
    result: boolean;
}

export interface ManagerActionOptions {
    galleryId: string;
    articleId: number;
}

export interface ChangeHeadTextOptions extends ManagerActionOptions {
    headTextId: number;
}

export interface ManagerActionResult {
    result: boolean;
    cause: string;
    state: string | null;
}

export type BlockCategory = "obscene" | "advertisement" | "cussWords" | "spamming" | "piracy" | "defamation" | "custom";

export interface UserBlockOptions extends ManagerActionOptions {
    commentId?: number;
    blockHour?: number;
    category?: BlockCategory;
    reason?: string;
}

export interface UserBlockResult {
    result: boolean;
    cause: string;
}

export interface NoMemberBlockOptions {
    galleryId: string;
    proxyUntil?: Date;
    cellularUntil?: Date;
    image?: {
        until: Date;
        status: "" | "A" | "P" | "M" | "P,M";
    };
}

export interface NoMemberBlockResult {
    result: boolean;
    message: string;
}

export interface MovieUploadOptions {
    galleryId: string;
    galleryType?: GalleryType;
    file: Blob | File;
    checkRestriction?: boolean;
}

export interface MovieUploadResult {
    message: string | null;
    fileId: number | null;
    thumbnailUrls: string[] | null;
    width: number | null;
    height: number | null;
}