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
export {inferGalleryType, normalizeGalleryId, normalizeGalleryType} from "./core/http/gallery-id";

// 모듈
export {ArticleManager} from "./modules/articles";
export {CommentManager} from "./modules/comments";
export {DCConManager} from "./modules/dccon";
export {
    captchaImageUrl,
    createCaptchaDccode,
    createCaptchaChallenge,
    downloadCaptchaImage,
    type CaptchaKind,
    type CaptchaImageRequest,
    type CaptchaDownloadResult
} from "./modules/captcha";
export {GalleryManager} from "./modules/galleries";
export {ManagementManager} from "./modules/management";
export {SearchManager} from "./modules/search";
export {UserManager} from "./modules/user";

// 타입과 에러
export * from "./core/types";
export * from "./core/http/errors";