export {DCInside, type DCInsideOptions} from "./client";
export {
    Auth,
    type AnonymousSession,
    type CaptchaAnswer,
    type CheckinCredentials,
    type DeviceCredentials,
    type LoginOptions,
    type LoginSession,
    type Session
} from "./auth";
export {Http, type AuthContext, type FieldValue, type Fields, type HttpOptions, type RequestOptions} from "./http";
export {captchaUrl, newCaptchaKey, type CaptchaKind} from "./captcha";
export {APP, FIREBASE, HOST} from "./constants";
export {
    ApiError,
    AuthExpiredError,
    CaptchaRequiredError,
    DCInsideError,
    HTTPError,
    OtpRequiredError,
    SessionRequiredError
} from "./errors";
export {decodeHtml, escapeHtml, textToHtml} from "./util";

export {AiImageApi, type AiImageOptions} from "./api/ai";
export {AppApi} from "./api/app";
export {ArticleApi, type ArticleBlock, type ArticleListOptions, type ArticleReadOptions, type ArticleSearchType, type ArticleWriteOptions, type PollCreateOptions} from "./api/articles";
export {AutoImageApi} from "./api/auto-images";
export {CommentApi, type CommentContent, type CommentListOptions, type CommentWriteOptions, type ParentComment} from "./api/comments";
export {DCConApi, type DCConRef} from "./api/dccons";
export {GalleryApi, type GalleryKind} from "./api/galleries";
export {GallogApi, type GallogCategory, type GallogHome, type GallogItem, type GallogList, type GuestbookEntry} from "./api/gallog";
export {ManagementApi, type BlockCategory, type BlockNoMemberOptions, type BlockUserOptions, type ImageBlockTarget, type ManageHistoryCategory} from "./api/management";
export {NotificationApi, type AlarmSettingUpdate, type AlarmType} from "./api/notifications";
export {SearchApi, type SearchOptions, type SearchType} from "./api/search";
export {UploadApi, type MovieInfo} from "./api/uploads";
export {UserApi, type ScrapTarget} from "./api/user";

export type * from "./types/responses";
