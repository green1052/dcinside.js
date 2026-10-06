import {HOST} from "../constants";
import type {Fields} from "../http";
import type {
    ApiResult,
    BigDCConResult,
    DCConBuyResult,
    DCConFolderList,
    DCConFolderResult,
    DCConInsertResult,
    DCConItem,
    DCConListResponse,
    DCConPackageDetail,
    DCConSettingList
} from "../types/responses";
import {indexed} from "../util";
import {Api} from "./context";

/** 디시콘 하나를 가리키는 값입니다. `recent()`/`detail()` 항목을 그대로 넘겨도 됩니다. */
export interface DCConRef {
    package_idx: number;
    detail_idx: number;
    title?: string;
}

/**
 * 디시콘 API입니다. 보유 목록/폴더/구매는 로그인이 필요합니다.
 */
export class DCConApi extends Api {
    /** 보유 디시콘 탭과 목록입니다. (`dccon.php`, `list`) */
    list(): Promise<DCConListResponse> {
        return this.dccon({type: "list"});
    }

    /** 최근 사용한 디시콘입니다. (`recent`) */
    recent(): Promise<DCConItem[]> {
        return this.dccon({type: "recent"}, true);
    }

    /** 패키지 상세(디시콘 목록 포함)입니다. (`package_detail`) */
    detail(packageIdx: number): Promise<DCConPackageDetail> {
        return this.dccon({package_idx: packageIdx, type: "package_detail"});
    }

    /** 패키지를 구매합니다. (`buy_dccon`) */
    buy(packageIdx: number): Promise<DCConBuyResult> {
        return this.dccon({package_idx: packageIdx, type: "buy_dccon"});
    }

    /** 본문/댓글에 넣을 디시콘 태그(`img_tag`)를 받습니다. (`insert`) */
    insert(dccon: DCConRef): Promise<DCConInsertResult> {
        return this.dccon({package_idx: dccon.package_idx, detail_idx: dccon.detail_idx, type: "insert"});
    }

    /** 탭 정렬/숨김 설정입니다. (`setting`) */
    settings(): Promise<DCConSettingList> {
        return this.dccon({type: "setting"});
    }

    /** 탭 설정을 저장합니다. `data`는 앱이 보내는 `setting_data` 값 목록입니다. (`setting_save`) */
    saveSettings(data: string[]): Promise<ApiResult> {
        return this.dccon({type: "setting_save", ...indexed("setting_data", data)});
    }

    /** 큰 디시콘 사용 가능 여부입니다. (`chk_bigdccon`) */
    bigDccon(): Promise<BigDCConResult> {
        return this.dccon({type: "chk_bigdccon"});
    }

    /** 보유 패키지를 지웁니다. (`dccon/del`) */
    deletePackages(packageIdx: number[]): Promise<DCConFolderResult> {
        return this.rest("del", {package_idx_list: JSON.stringify(packageIdx)});
    }

    /** 디시콘 폴더 목록입니다. (`dccon/folder`) */
    folders(): Promise<DCConFolderList> {
        return this.http.get(`${HOST.app}/api/dccon/folder`, {user_id: this.requireLogin().userId});
    }

    addFolder(name: string): Promise<DCConFolderResult> {
        return this.rest("folder/add", {folder_name: name});
    }

    deleteFolder(name: string): Promise<DCConFolderResult> {
        return this.rest("folder/del", {folder_name: name});
    }

    /** 폴더 이름/아이콘을 바꿉니다. `icons`는 앱이 보내는 아이콘 값입니다. */
    updateFolder(oldName: string, newName: string, icons?: string): Promise<DCConFolderResult> {
        return this.rest("folder/update", {old_folder_name: oldName, new_folder_name: newName, icons});
    }

    /** 폴더 순서를 저장합니다. */
    updateFolderList(folders: unknown[]): Promise<DCConFolderResult> {
        return this.rest("folder/update-list", {folder_list: JSON.stringify(folders)});
    }

    /** 디시콘을 폴더에 넣습니다. `folderNames`는 앱이 보내는 폴더 이름 값입니다. */
    addToFolder(dccon: DCConRef, folderNames: string): Promise<DCConFolderResult> {
        return this.rest("folder-item/add", {...this.item(dccon), folder_names: folderNames});
    }

    removeFromFolder(dccon: DCConRef, folderName: string): Promise<DCConFolderResult> {
        return this.rest("folder-item/del", {...this.item(dccon), folder_name: folderName});
    }

    private item(dccon: DCConRef): Fields {
        return {package_idx: dccon.package_idx, detail_idx: dccon.detail_idx, title: dccon.title};
    }

    private dccon<T>(fields: Fields, list = false): Promise<T> {
        return this.http.post(`${HOST.app}/api/dccon.php`, {user_id: this.userId, ...fields}, {list});
    }

    private rest<T>(path: string, fields: Fields): Promise<T> {
        return this.http.post(`${HOST.app}/api/dccon/${path}`, {user_id: this.requireLogin().userId, ...fields});
    }
}
