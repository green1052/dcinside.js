import {HOST} from "../constants";
import type {
    ApiResult,
    ManageHistoryResponse,
    ManagerActionResult,
    ManagerAppointResult,
    ManagerEntrustResult,
    ManagerInfo
} from "../types/responses";
import {galleryKind, indexed, stripGalleryPrefix} from "../util";
import {Api} from "./context";

/** 차단 사유입니다. `custom`이면 `reason`을 함께 넘기세요. */
export type BlockCategory = "obscene" | "advertisement" | "cussWords" | "spamming" | "piracy" | "defamation" | "custom";

const BLOCK_CATEGORY: Record<BlockCategory, number> = {
    obscene: 1, advertisement: 2, cussWords: 3, spamming: 4, piracy: 5, defamation: 6, custom: 7
};

export interface BlockUserOptions {
    gallery: string;
    no: number;
    /** 댓글 작성자를 차단할 때 댓글 번호입니다. */
    commentNo?: number;
    /** 차단 시간(시간 단위)입니다. 기본 1입니다. */
    hours?: number;
    category?: BlockCategory;
    reason?: string;
}

export interface BlockNoMemberOptions {
    gallery: string;
    proxyUntil?: Date;
    cellularUntil?: Date;
    image?: { until: Date; status: "" | "A" | "P" | "M" | "P,M" };
}

/** 이미지 차단에 필요한 값입니다. `articles.read()`의 `view_main.pum_info`/이미지 속성에서 얻습니다. */
export interface ImageBlockTarget {
    rel1: string;
    rel2: string;
}

/** 매니저 관리 내역 분류입니다. */
export type ManageHistoryCategory = "avoid" | "delete" | "setting";

/**
 * 갤러리 매니저 기능입니다. 모두 로그인 세션과 해당 갤러리 권한이 필요합니다.
 */
export class ManagementApi extends Api {
    /** 공지로 올리거나 내립니다. (`_manager_request.php`, `notify`) */
    async setNotice(gallery: string, no: number): Promise<ManagerActionResult> {
        return this.request(gallery, no, {mode: "notify"});
    }

    /** 개념글로 지정하거나 해제합니다. (`recommend`) */
    async setRecommend(gallery: string, no: number): Promise<ManagerActionResult> {
        return this.request(gallery, no, {mode: "recommend"});
    }

    /** 글을 끌어올립니다. (`bump`) */
    async bump(gallery: string, no: number): Promise<ManagerActionResult> {
        return this.request(gallery, no, {mode: "bump"});
    }

    /** 말머리를 바꿉니다. (`headtext`) */
    async changeHeadText(gallery: string, no: number, headNo: number): Promise<ManagerActionResult> {
        return this.request(gallery, no, {mode: "headtext", headtxt_no: headNo});
    }

    /** 공지 순서를 바꿉니다. `order`는 공지 글 번호를 원하는 순서대로 넘깁니다. (`change_noti`) */
    async reorderNotices(gallery: string, no: number, order: number[]): Promise<ManagerActionResult> {
        return this.request(gallery, no, {mode: "change_noti", ...indexed("o_no", order)});
    }

    /** 오늘의 글로 고정합니다. (`fixtoday`) */
    async fixToday(gallery: string, no: number): Promise<ApiResult> {
        return this.post("ApiResult", `${HOST.app}/api/fixtoday`, {user_id: this.requireLogin().userId, id: gallery, no});
    }

    /** 글의 이미지를 차단합니다. (`management/{종류}/blockImg/{id}`) */
    async blockImage(gallery: string, no: number, target: ImageBlockTarget & { imgSrc: string; subject: string }): Promise<ApiResult> {
        return this.post("ApiResult", this.managementUrl(gallery, "blockImg"), {
            confirm_id: this.requireLogin().userId, no, rel1: target.rel1, rel2: target.rel2, imgSrc: target.imgSrc, subject: target.subject
        });
    }

    /** 이미지 차단을 풉니다. (`blockImgClear`) */
    async clearImageBlock(gallery: string, target: ImageBlockTarget): Promise<ApiResult> {
        return this.post("ApiResult", this.managementUrl(gallery, "blockImgClear"), {
            confirm_id: this.requireLogin().userId, rel1: target.rel1, rel2: target.rel2
        });
    }

    /** 관리 내역입니다. (`managehistory`) */
    async history(gallery: string, options: { category?: ManageHistoryCategory; page?: number; mine?: boolean; search?: string } = {}): Promise<ManageHistoryResponse> {
        return this.post("ManageHistoryResponse", `${HOST.app}/api/managehistory`, {
            confirm_id: this.requireLogin().userId,
            id: gallery,
            category: options.category,
            page: options.page ?? 1,
            mylist: options.mine ?? false,
            search: options.search
        });
    }

    /** 매니저/부매니저 정보와 위임 가능 회원입니다. (`manager_info`) */
    async managerInfo(gallery: string): Promise<ManagerInfo> {
        return this.post("ManagerInfo", `${HOST.app}/api/manager_info`, {confirm_id: this.requireLogin().userId, id: gallery});
    }

    /** 매니저 위임을 신청합니다. (`manager_entrust`) */
    async entrust(gallery: string, memo: string): Promise<ManagerEntrustResult> {
        return this.post("ManagerEntrustResult", `${HOST.app}/api/manager_entrust`, {confirm_id: this.requireLogin().userId, entrust_memo: memo, id: gallery});
    }

    /** 매니저 임명 제안에 응답합니다. (`minor/minor-appointagreemanager`) */
    async respondAppointment(gallery: string, mode: string, agree: boolean): Promise<ManagerAppointResult> {
        return this.post("ManagerAppointResult", `${HOST.app}/minor/minor-appointagreemanager`, {
            id: gallery, confirm_id: this.requireLogin().userId, mode, agree
        });
    }

    /** 이용자를 차단합니다. 앱이 아닌 모바일 웹 엔드포인트(`minor_avoidadd`)입니다. */
    async blockUser(options: BlockUserOptions): Promise<ApiResult> {
        const category = options.category ?? "custom";
        return this.post("ApiResult", `${HOST.app}/api/minor_avoidadd`, {
            user_id: this.requireLogin().userId,
            _token: "",
            avoid_hour: options.hours ?? 1,
            avoid_category: BLOCK_CATEGORY[category],
            avoid_memo: category === "custom" ? options.reason ?? "" : "",
            id: options.gallery,
            no: options.no,
            comment_no: options.commentNo ?? ""
        }, {urlencoded: true});
    }

    /** 비회원 IP/통신사/이미지 차단을 설정합니다. 모바일 웹 엔드포인트(`management/minor/nomember`)입니다. */
    async blockNoMember(options: BlockNoMemberOptions): Promise<ApiResult> {
        this.requireLogin();
        return this.post("ApiResult", `${HOST.mobile}/management/minor/nomember/${options.gallery}`, {
            proxyDate: formatDate(options.proxyUntil),
            mobileDate: formatDate(options.cellularUntil),
            imgDate: formatDate(options.image?.until),
            imgStatus: options.image?.status ?? ""
        }, {urlencoded: true});
    }

    /** 앱의 갤러리 관리 웹페이지 주소입니다. 메인 갤러리는 `main: true`를 넘기세요. */
    async settingsUrl(gallery: string, options: { main?: boolean } = {}): Promise<string> {
        const kind = galleryKind(gallery);
        const url = options.main
            ? new URL(`${HOST.pc}/management/mobile`)
            : new URL(`${HOST.mobile}/management/${kind === "board" ? "minor" : kind}/main/${stripGalleryPrefix(gallery)}`);
        if (options.main) url.searchParams.set("id", gallery);
        url.searchParams.set("app_id", await this.ctx.auth.appId());
        url.searchParams.set("confirm_id", this.requireLogin().userId);
        return url.toString();
    }

    /** 앱의 이용자 차단 웹페이지 주소입니다. (`m.dcinside.com/api/minor_avoid`) */
    async blockUserUrl(gallery: string, no: number, commentNo?: number): Promise<string> {
        const url = new URL(`${HOST.mobile}/api/minor_avoid`);
        url.searchParams.set("app_id", await this.ctx.auth.appId());
        url.searchParams.set("id", gallery);
        url.searchParams.set("no", String(no));
        if (commentNo) url.searchParams.set("comment_no", String(commentNo));
        url.searchParams.set("confirm_id", this.requireLogin().userId);
        return url.toString();
    }

    private request(gallery: string, no: number, fields: Record<string, string | number>): Promise<ManagerActionResult> {
        return this.post("ManagerActionResult", `${HOST.app}/api/_manager_request.php`, {id: gallery, user_id: this.requireLogin().userId, no, ...fields});
    }

    private managementUrl(gallery: string, action: string): string {
        const kind = galleryKind(gallery);
        return `${HOST.app}/management/${kind === "board" ? "minor" : kind}/${action}/${stripGalleryPrefix(gallery)}`;
    }
}

/** 서울 시간 `YYYY.MM.DD HH:mm`입니다. */
function formatDate(date: Date | undefined): string {
    if (!date) return "";
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(date).map((part) => [part.type, part.value]));
    return `${parts["year"]}.${parts["month"]}.${parts["day"]} ${parts["hour"]}:${parts["minute"]}`;
}
