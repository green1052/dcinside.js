// 클라이언트
export {DCInsideClient, type DCInsideClientOptions} from "./client";
export {ArticleClient, GalleryClient} from "./client/gallery";

// 인증
export {AuthManager} from "./core/auth";
export {createAndroidCheckinRequest, parseAndroidCheckinResponse} from "./core/auth/checkin";

// HTTP
export {
    KyHttpClient,
    buildFormData,
    postMultipartJson,
    type MultipartFields,
    type MultipartValue,
    type DCInsideRequestContext,
    type ProxyOptions
} from "./core/http";
export {isCaptchaCause, readCaptchaChallenge, assertResponseAuthExpired} from "./core/http/api-error";
export {escapeHtml, decodeHtml, escapeMemoHtml, dedupeDetailIndices} from "./core/http/utils";

// 모듈
export {ArticleManager, type GalleryArticleScopedOptions, type ArticleEntryScopedOptions} from "./modules/articles";
export {CommentManager, type ArticleCommentScopedOptions} from "./modules/comments";
export {DCConManager} from "./modules/dccon";
export {
    captchaImageUrl,
    createCaptchaDccode,
    createCaptchaChallenge,
    captchaKindForAction,
    downloadCaptchaImage,
    type CaptchaKind,
    type CaptchaImageRequest,
    type CaptchaDownloadResult
} from "./modules/captcha";
export {GalleryManager} from "./modules/galleries";
export {ManagementManager} from "./modules/management";
export {NotificationManager} from "./modules/notifications";
export {SearchManager} from "./modules/search";
export {UserManager} from "./modules/user";

// 타입
export type {
    GalleryType,
    Gallery,
    GalleryTarget,
    HeadText,
    GalleryInfo,
    RankingType,
    GalleryRankingItem,
    MinorGalleryInfo,
    MiniGalleryInfo,
    GalleryManagerSummary,
    MainPageHitArticle,
    MainPageLiveBestArticle,
    MainPageResult
} from "./core/types/gallery";
export type {
    User,
    LoginInput,
    SessionDetail,
    Session,
    FirebaseInstallation,
    AndroidCheckinCredentials,
    ClientTokenResult,
    DeviceCredentials
} from "./core/types/auth";
export type {CaptchaAnswer, CaptchaChallenge} from "./core/types/captcha";
export type {
    DCCon,
    DCConListResult,
    DCConInfo,
    DCConDetailResult,
    DCConInsertResult,
    DCConBuyResult
} from "./core/types/dccon";
export type {
    ArticleListOptions,
    ArticleListItem,
    ArticleListResult,
    ArticleReadOptions,
    ArticleViewInfo,
    ArticleViewMain,
    ArticleReadResult,
    ArticleContent,
    ArticleWriteOptions,
    ArticleWriteResult,
    ArticleDeleteOptions,
    ArticleDeleteResult,
    ArticleVoteOptions,
    ArticleVoteResult,
    ArticleModifyInfoOptions,
    ArticleModifyInfoResult
} from "./core/types/article";
export type {
    CommentContent,
    CommentReadOptions,
    CommentData,
    CommentMention,
    CommentReadResult,
    CommentWriteOptions,
    CommentReplyOptions,
    CommentDeleteOptions,
    CommentDeleteResult,
    CommentWriteResult
} from "./core/types/comment";
export type {
    TotalSearchResult,
    SearchWikiItem,
    SearchRealTimeItem,
    SearchArticle,
    GallerySearchResult
} from "./core/types/search";
export type {
    MyGalleryResult,
    ManagedGallery,
    JoinedMiniGallery,
    JoinedMiniGalleryResult,
    ModifyMyGalleryResult,
    MiniGalleryJoinResult,
    MiniGalleryJoinOkResult,
    MiniGalleryQuitResult
} from "./core/types/user";
export type {
    ManagerActionOptions,
    ChangeHeadTextOptions,
    ManagerActionResult,
    BlockCategory,
    UserBlockOptions,
    UserBlockResult,
    NoMemberBlockOptions,
    NoMemberBlockResult,
    MovieUploadOptions,
    MovieUploadResult
} from "./core/types/management";
export type {
    NotificationResult,
    CommentNotificationOptions,
    MinorNotificationOptions,
    ArticleNotificationOptions,
    UserNotificationOptions,
    GalleryNotificationOptions,
    KeywordNotificationOptions,
    GalleryScopedNotificationListOptions,
    AlarmNotificationListOptions,
    ArticleNotificationSubscription,
    UserNotificationSubscription,
    KeywordNotificationSubscription,
    GalleryNotificationSubscription,
    AlarmType,
    AlarmItem,
    ArticleNotificationListResult,
    UserNotificationListResult,
    KeywordNotificationListResult,
    GalleryNotificationListResult,
    AlarmListResult
} from "./core/types/notification";

// 에러
export {
    DCInsideError,
    HTTPError,
    AuthenticationError,
    PermissionError,
    CaptchaRequiredError,
    LoginOtpRequiredError,
    LoginCaptchaRequiredError,
    AuthExpiredError,
    type CaptchaAction,
    type AuthExpiredKind
} from "./core/http/errors";