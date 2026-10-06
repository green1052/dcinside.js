import {HOST} from "../constants";
import type {Fields} from "../http";
import type {
    ApiResult,
    HitconSettingResult,
    JoinedMiniGalleries,
    ManagedGallery,
    MiniGalleryJoinConfirmResult,
    MiniGalleryJoinResponse,
    MyGalleryResponse,
    ScrapFolderList,
    ScrapFolderResult,
    ScrapShareMultiResult,
    ScrapShareResult
} from "../types/responses";
import {indexed} from "../util";
import {Api} from "./context";

/** 스크랩 대상입니다. `type`은 앱 내부 스크랩 종류 값입니다. */
export interface ScrapTarget {
    id: string;
    no: number | string;
    type?: string;
}

/**
 * 로그인 사용자 기능입니다. 모두 로그인 세션이 필요합니다.
 */
export class UserApi extends Api {
    /** 내 갤러리와 즐겨찾기입니다. (`mygall.php`) */
    myGalleries(): Promise<MyGalleryResponse> {
        return this.post("api/mygall.php", {});
    }

    /** 즐겨찾기에 갤러리를 추가합니다. (`mygall_modify.php`, `favori_gall`) */
    addFavorite(gallery: string, name: string): Promise<ApiResult> {
        return this.post("api/mygall_modify.php", {gall_nm: name, gall_id: gallery, mode: "favori_gall"});
    }

    /** 즐겨찾기 순서를 바꿉니다. 갤러리 ID를 원하는 순서대로 넘기세요. */
    sortFavorites(galleries: string[]): Promise<ApiResult> {
        return this.post("api/mygall_modify.php", {...indexed("gall_array", galleries), mode: "favori_gall_sort"});
    }

    /** 즐겨찾기를 모두 지웁니다. */
    clearFavorites(): Promise<ApiResult> {
        return this.post("api/mygall_modify.php", {mode: "favori_all_del"});
    }

    /** 내가 관리하는 갤러리입니다. (`mymanageGallChk`) */
    managedGalleries(): Promise<ManagedGallery> {
        return this.post("api/mymanageGallChk", {});
    }

    /** 가입/대기/탈퇴한 미니 갤러리입니다. (`myminijoinGallChk`) */
    joinedMiniGalleries(): Promise<JoinedMiniGalleries> {
        return this.post("api/myminijoinGallChk", {});
    }

    /** 미니 갤러리 가입을 시작합니다. 응답에 가입 질문이 있으면 `confirmMiniJoin()`으로 답하세요. (`memberjoin`) */
    joinMini(gallery: string): Promise<MiniGalleryJoinResponse> {
        return this.post("api/memberjoin", {id: gallery});
    }

    /** 미니 갤러리 가입을 신청합니다. `answer`는 가입 질문 답입니다. (`memberjoin_ok`) */
    confirmMiniJoin(gallery: string, answer?: string): Promise<MiniGalleryJoinConfirmResult> {
        return this.post("api/memberjoin_ok", {id: gallery, question_memo: answer});
    }

    /** 미니 갤러리 가입 신청을 취소합니다. (`memberjoincancel`) */
    cancelMiniJoin(gallery: string): Promise<ApiResult> {
        return this.post("api/memberjoincancel", {id: gallery});
    }

    /** 미니 갤러리에서 탈퇴합니다. (`memberout_ok`) */
    quitMini(gallery: string): Promise<ApiResult> {
        return this.post("api/memberout_ok", {id: gallery});
    }

    /** 힛콘(베스트콘) 사용 여부를 조회/변경합니다. 인자를 생략하면 조회만 합니다. (`m.dcinside.com/aside/usehitcon`) */
    hitcon(use?: boolean): Promise<HitconSettingResult> {
        return this.http.post(`${HOST.mobile}/aside/usehitcon`, {confirm_id: this.requireLogin().userId, use_bestcon: use});
    }

    /** 스크랩 폴더 목록입니다. (`scrap-folder`) */
    scrapFolders(): Promise<ScrapFolderList> {
        return this.scrap("scrap-folder", {});
    }

    /** 스크랩 폴더를 만들거나(`mode: "add"`) 이름을 바꿉니다. (`edit-scrap-folder`) */
    editScrapFolder(mode: string, name: string, folderNo?: number): Promise<ScrapFolderResult> {
        return this.scrap("edit-scrap-folder", {mode, f_name: name, f_no: folderNo});
    }

    /** 스크랩 폴더를 지웁니다. `moveTo`가 있으면 안의 스크랩을 그 폴더로 옮깁니다. (`delete-scrap-folder`) */
    deleteScrapFolder(folderNo: number, moveTo?: number): Promise<ScrapFolderResult> {
        return this.scrap("delete-scrap-folder", {f_no: folderNo, move_no: moveTo});
    }

    /** 스크랩 폴더를 `target` 폴더의 앞(`prev`)이나 뒤(`next`)로 옮깁니다. (`sort-scrap-folder`) */
    sortScrapFolder(folderNo: number, direction: "next" | "prev", target: number): Promise<ScrapFolderResult> {
        return this.scrap("sort-scrap-folder", {f_no: folderNo, [direction]: target});
    }

    /** 스크랩을 다른 폴더로 옮기거나 공개 여부를 바꿉니다. (`move-scrap`) */
    moveScrap(scrap: string, folderNo: number, visible: boolean): Promise<ScrapFolderResult> {
        return this.scrap("move-scrap", {is_view: visible, f_no: folderNo, scrap});
    }

    /** 글을 스크랩합니다. (`share-scrap`) */
    addScrap(target: ScrapTarget): Promise<ScrapShareResult> {
        return this.scrap("share-scrap", {id: target.id, no: target.no, type: target.type});
    }

    /** 여러 글을 한 폴더에 스크랩합니다. (`share-scrap-multi`) */
    addScraps(folderNo: number, targets: ScrapTarget[]): Promise<ScrapShareMultiResult> {
        return this.scrap("share-scrap-multi", {f_no: folderNo, scrap_list: JSON.stringify(targets)});
    }

    /** 스크랩을 지웁니다. (`del-scrap`) */
    deleteScrap(target: ScrapTarget): Promise<ApiResult> {
        return this.scrap("del-scrap", {id: target.id, no: target.no, type: target.type});
    }

    private post<T>(path: string, fields: Fields): Promise<T> {
        return this.http.post(`${HOST.app}/${path}`, {user_id: this.requireLogin().userId, ...fields});
    }

    private scrap<T>(path: string, fields: Fields): Promise<T> {
        return this.http.post(`${HOST.app}/api/${path}`, {confirm_id: this.requireLogin().userId, ...fields});
    }
}
