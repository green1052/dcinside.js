import type {AuthManager} from "../auth";
import {type KyHttpClient, postMultipartJson} from "../http";
import {API_URL, DC_APP} from "../http/constants";
import {booleanValue, firstObject, nullableString, objectValue, stringValue} from "../http/json";
import type {
    ChangeHeadTextOptions,
    ManagerActionOptions,
    ManagerActionResult,
    NoMemberBlockOptions,
    NoMemberBlockResult,
    Session,
    UserBlockOptions,
    UserBlockResult
} from "../types";

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
 * 갤러리 관리 매니저. 공지/추천/말머리/유저 차단/비회원 차단 흐름을 다룬다.
 * 로그인 세션(상세 정보 포함)이 필요하다.
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

    /** 게시글을 공지로 지정/해제. */
    async setNotice(options: ManagerActionOptions): Promise<ManagerActionResult> {
        return this.managerRequest("notify", options);
    }

    /** 게시글을 추천글로 지정/해제. */
    async setRecommend(options: ManagerActionOptions): Promise<ManagerActionResult> {
        return this.managerRequest("recommend", options);
    }

    /** 게시글의 말머리를 변경. */
    async changeHeadText(options: ChangeHeadTextOptions): Promise<ManagerActionResult> {
        return this.managerRequest("headtext", options, {
            headtxt_no: String(options.headTextId)
        });
    }

    /** 유저를 차단. 로그인 세션 필요. */
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

    /** 비회원 IP/통신사/이미지 차단. 로그인 세션 필요. */
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

    /** 갤러리 설정 모바일 페이지 링크를 생성. */
    async gallerySettingLink(galleryId: string): Promise<string> {
        const session = this.requireLogin();
        const url = new URL(API_URL.gallery.minorManagement);
        url.searchParams.set("id", galleryId);
        url.searchParams.set("app_id", await this.auth.getAppId());
        url.searchParams.set("confirm_id", session.detail?.userId ?? "");
        return url.toString();
    }

    /** 유저 차단 웹 페이지 링크를 생성. */
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

    /** 공지/추천/말머리 변경 관리자 요청 공용 전송. */
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

    /** 로그인(상세 포함) 세션을 요구하거나 에러를 던진다. */
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