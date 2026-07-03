import type {AuthManager} from "../../core/auth";
import {type KyHttpClient, postMultipartJson} from "../../core/http";
import {API_URL, DC_APP} from "../../core/http/constants";
import {booleanValue, firstObject, nullableString, objectValue, stringValue} from "../../core/http/json";
import type {
    ChangeHeadTextOptions,
    ManagerActionOptions,
    ManagerActionResult,
    NoMemberBlockOptions,
    NoMemberBlockResult,
    Session,
    UserBlockOptions,
    UserBlockResult
} from "../../core/types";

const blockCategoryCode = {
    obscene: 1,
    advertisement: 2,
    cussWords: 3,
    spamming: 4,
    piracy: 5,
    defamation: 6,
    custom: 7
} as const;

/**
 * 공지, 추천, 말머리, 유저 차단, 비회원 차단 같은 갤러리 관리 흐름을 처리합니다.
 *
 * 모든 요청에는 상세 정보가 포함된 로그인 세션이 필요합니다.
 */
export class ManagementManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly auth: AuthManager,
        private readonly getSession: () => Session | null
    ) {
    }

    get userAgent(): string {
        return DC_APP.userAgent;
    }

    /**
     * 게시글을 공지로 지정하거나 해제합니다.
     *
     * @param options 갤러리 ID와 게시글 번호입니다.
     * @returns 적용 성공 여부와 서버 상태입니다.
     */
    async setNotice(options: ManagerActionOptions): Promise<ManagerActionResult> {
        return this.managerRequest("notify", options);
    }

    /**
     * 게시글을 추천글로 지정하거나 해제합니다.
     *
     * @param options 갤러리 ID와 게시글 번호입니다.
     * @returns 적용 성공 여부와 서버 상태입니다.
     */
    async setRecommend(options: ManagerActionOptions): Promise<ManagerActionResult> {
        return this.managerRequest("recommend", options);
    }

    /**
     * 게시글의 말머리를 변경합니다.
     *
     * @param options 갤러리 ID, 게시글 번호, 변경할 말머리 ID입니다.
     * @returns 변경 성공 여부와 서버 상태입니다.
     */
    async changeHeadText(options: ChangeHeadTextOptions): Promise<ManagerActionResult> {
        return this.managerRequest("headtext", options, {
            headtxt_no: String(options.headTextId)
        });
    }

    /**
     * 게시글 또는 댓글 작성자를 차단합니다.
     *
     * @param options 갤러리 ID, 게시글 번호, 선택적 댓글 번호, 차단 시간과 사유입니다.
     * @returns 차단 성공 여부와 서버 메시지입니다.
     */
    async blockUser(options: UserBlockOptions): Promise<UserBlockResult> {
        this.requireLogin();
        const response = await this.http.ky.post(API_URL.gallery.minorBlockAdd, {
            body: new URLSearchParams({
                _token: "",
                avoid_hour: String(options.blockHour ?? 1),
                avoid_category: String(blockCategoryCode[options.category ?? "custom"]),
                avoid_memo: (options.category ?? "custom") === "custom" ? options.reason ?? "사유 없음" : "",
                id: options.galleryId,
                no: String(options.articleId),
                comment_no: options.commentId && options.commentId > 0 ? String(options.commentId) : ""
            })
        }).json();
        const json = objectValue(response);
        return {
            result: booleanValue(json["result"]),
            cause: stringValue(json["cause"])
        };
    }

    /**
     * 비회원 IP, 통신사, 이미지 업로드 차단 설정을 변경합니다.
     *
     * @param options 갤러리 ID와 차단 만료 시각입니다.
     * @returns 설정 변경 성공 여부와 서버 메시지입니다.
     */
    async blockNoMember(options: NoMemberBlockOptions): Promise<NoMemberBlockResult> {
        this.requireLogin();
        const response = await this.http.ky.post(`${API_URL.gallery.minorNoMember}/${options.galleryId}`, {
            body: new URLSearchParams({
                proxyDate: options.proxyUntil ? formatManagementDate(options.proxyUntil) : "",
                mobileDate: options.cellularUntil ? formatManagementDate(options.cellularUntil) : "",
                imgDate: options.image ? formatManagementDate(options.image.until) : "",
                imgStatus: options.image?.status ?? ""
            })
        }).json();
        const json = objectValue(response);
        return {
            result: booleanValue(json["result"]),
            message: stringValue(json["msg"])
        };
    }

    /**
     * 갤러리 설정 모바일 페이지 링크를 생성합니다.
     *
     * @param galleryId 설정 페이지를 열 갤러리 ID입니다.
     * @returns `app_id`와 `confirm_id`가 포함된 설정 페이지 URL입니다.
     */
    async gallerySettingLink(galleryId: string): Promise<string> {
        const session = this.requireLogin();
        const url = new URL(API_URL.gallery.minorManagement);
        url.searchParams.set("id", galleryId);
        url.searchParams.set("app_id", await this.auth.getAppId());
        url.searchParams.set("confirm_id", session.detail?.userId ?? "");
        return url.toString();
    }

    /**
     * 유저 차단 웹 페이지 링크를 생성합니다.
     *
     * @param options 갤러리 ID, 게시글 번호, 선택적 댓글 번호입니다.
     * @returns `app_id`와 `confirm_id`가 포함된 차단 페이지 URL입니다.
     */
    async userBlockLink(options: Pick<UserBlockOptions, "galleryId" | "articleId" | "commentId">): Promise<string> {
        const session = this.requireLogin();
        const url = new URL(API_URL.gallery.minorBlockWeb);
        url.searchParams.set("id", options.galleryId);
        url.searchParams.set("no", String(options.articleId));
        url.searchParams.set("app_id", await this.auth.getAppId());
        url.searchParams.set("confirm_id", session.detail?.userId ?? "");
        if (options.commentId && options.commentId > 0) url.searchParams.set("comment_no", String(options.commentId));
        return url.toString();
    }

    /** 공지, 추천, 말머리 변경 관리자 요청을 공통 형식으로 전송합니다. */
    private async managerRequest(
        mode: "notify" | "recommend" | "headtext",
        options: ManagerActionOptions,
        extra: Record<string, string | number | boolean | null | undefined> = {}
    ): Promise<ManagerActionResult> {
        this.requireLogin();
        const raw = await postMultipartJson(this.http, API_URL.gallery.minorManagerRequest, {
            id: options.galleryId,
            no: options.articleId,
            mode,
            ...extra
        });
        const json = firstObject(raw);
        return {
            result: booleanValue(json["result"]),
            cause: stringValue(json["cause"]),
            state: nullableString(json["state"])
        };
    }

    /** 상세 정보가 포함된 로그인 세션을 가져오거나 에러를 던집니다. */
    private requireLogin(): Session {
        const session = this.getSession();
        if (!session?.detail) {
            throw new Error("A logged-in manager session is required. Call client.login(...).");
        }
        return session;
    }
}

function formatManagementDate(date: Date): string {
    const parts = new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul"
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
    return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}
