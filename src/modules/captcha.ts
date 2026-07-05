import {createHash} from "node:crypto";
import {API_URL, DC_APP} from "../core/http/constants";
import type {CaptchaAction} from "../core/http/errors";
import type {CaptchaChallenge} from "../core/types";

/** 캡챠 종류. 요청하는 엔드포인트에 따라 다릅니다. */
export type CaptchaKind = "login" | "article" | "comment" | "recommend";

/** 캡챠 이미지 요청 파라미터입니다. */
export interface CaptchaImageRequest {
    /** 캡챠 종류입니다. */
    kind: CaptchaKind;
    /** 갤러리 ID입니다. 로그인 캡챠는 사용하지 않습니다. */
    galleryId?: string;
    /** 캡챠 세션 식별자입니다. 임의로 생성해 서버에 전달합니다. */
    dccode: string;
}

/** 캡챠 이미지를 다운로드한 결과입니다. 이미지 바이트를 메모리에 반환합니다. */
export interface CaptchaDownloadResult {
    url: string;
    status: number;
    contentType: string;
    byteLength: number;
    /** 다운로드한 이미지 바이트입니다. 필요 시 파일로 저장하거나 화면에 렌더링할 수 있습니다. */
    bytes: Buffer;
}

/** 캡챠 이미지 URL을 생성합니다. `dccode`를 `rand_code`로 사용합니다. */
export function captchaImageUrl(input: CaptchaImageRequest): string {
    const dccode = input.dccode.trim();
    if (!dccode) throw new Error("captcha dccode is required");
    if (input.kind === "login") {
        return `${API_URL.captcha.login}?id=login_botchk&type=L&dccode=${encodeURIComponent(dccode)}`;
    }
    const galleryId = (input.galleryId ?? "").trim();
    if (!galleryId) throw new Error("captcha gallery id is required");
    if (input.kind === "article") {
        return `${API_URL.captcha.article}?id=${encodeURIComponent(galleryId)}&dccode=${encodeURIComponent(dccode)}`;
    }
    const type = input.kind === "recommend" ? "R" : "C";
    return `${API_URL.captcha.comment}?type=${type}&id=${encodeURIComponent(galleryId)}&dccode=${encodeURIComponent(dccode)}`;
}

/** 캡챠 세션 식별자(`dccode`)를 난수 기반으로 생성합니다. SHA-256 해시를 사용합니다. */
export function createCaptchaDccode(now = Date.now(), random = Math.random): string {
    const entropy = `${now.toString(36)}-${random().toString(36).slice(2)}`;
    return createHash("sha256").update(entropy).digest("hex").slice(0, 16);
}

/** 작업 종류에 해당하는 캡챠 종류를 반환합니다. */
export function captchaKindForAction(action: CaptchaAction): CaptchaKind {
    if (action === "writeComment" || action === "writeReply") return "comment";
    if (action === "voteArticle") return "recommend";
    if (action === "login") return "login";
    return "article";
}

/** 캡챠 챌린지를 생성합니다. 이미지 URL과 세션 식별자를 포함합니다. */
export function createCaptchaChallenge(action: CaptchaAction, galleryId?: string): CaptchaChallenge {
    const dccode = createCaptchaDccode();
    const kind = captchaKindForAction(action);
    const imageUrl = captchaImageUrl({kind, ...(galleryId ? {galleryId} : {}), dccode});
    return {imageUrl, captcha: dccode};
}

/** 캡챠 이미지를 다운로드해 바이트 버퍼로 반환합니다. 파일 저장이 필요하면 호출 측에서 `bytes`를 직접 저장하세요. */
export async function downloadCaptchaImage(input: {
    url: string;
    fetch?: typeof fetch;
}): Promise<CaptchaDownloadResult> {
    const url = input.url.trim();
    if (!url) throw new Error("captcha url is required");
    const fetcher = input.fetch ?? fetch;
    const response = await fetcher(url, {
        headers: {"User-Agent": DC_APP.userAgent, Referer: DC_APP.referer}
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? "";
    if (response.status < 200 || response.status >= 300) {
        throw new Error(`captcha image HTTP ${response.status}`);
    }
    if (!contentType.toLowerCase().startsWith("image/")) {
        throw new Error(`captcha image content-type mismatch: ${contentType || "unknown"}`);
    }
    if (bytes.length === 0) throw new Error("captcha image response is empty");
    return {url, status: response.status, contentType, byteLength: bytes.length, bytes};
}