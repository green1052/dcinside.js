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
    galleryId: string;
    galleryType?: GalleryType;
    page?: number;
    searchKeyword?: string;
    searchType?: "all" | "subject" | "memo" | "name" | "subject_m";
    recommend?: boolean;
    notice?: boolean;
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
    galleryId: string;
    galleryType?: GalleryType;
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
    | string
    | {
    type: "text";
    text: string;
}
    | {
    type: "html";
    html: string;
}
    | {
    type: "markdown";
    markdown: string;
}
    | {
    type: "image";
    file: Blob | File;
    mimeType?: string;
}
    | {
    type: "dccon";
    imageTag: string;
    detailIndex: number;
};

export interface ArticleWriteOptions {
    galleryId: string;
    galleryType?: GalleryType;
    subject: string;
    content: ArticleContent[];
    headText?: Pick<HeadText, "no" | "name">;
    mode?: "write" | "modify";
}

export interface ArticleWriteResult {
    result: boolean;
    articleId: number | null;
    cause: string | null;
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