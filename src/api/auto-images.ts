import {HOST} from "../constants";
import type {Fields} from "../http";
import type {ApiResult, AutoImageGalleryList, AutoImageList, AutoImageSettingResult} from "../types/responses";
import {indexed} from "../util";
import {Api} from "./context";

/** 갤러리를 생략하면 앱의 "전체 기본 자동짤"(`X`)을 뜻합니다. */
const GLOBAL = "X";

/**
 * 자동짤(글 쓸 때 자동으로 붙는 이미지) API입니다. 로그인이 필요합니다.
 * 이미지는 먼저 `uploads.images()`로 올리고 받은 주소를 넘기세요.
 */
export class AutoImageApi extends Api {
    /** 갤러리의 자동짤 목록과 설정입니다. (`autozzal/list`) */
    list(gallery = GLOBAL): Promise<AutoImageList> {
        return this.get("list", {id: gallery});
    }

    /** 자동짤을 설정한 갤러리 목록입니다. (`autozzal/my_list`, `mode=gallery`) */
    galleries(): Promise<AutoImageGalleryList> {
        return this.get("my_list", {mode: "gallery"});
    }

    /** 내가 올린 자동짤 이미지 전체입니다. (`autozzal/my_list`, `mode=all`) */
    myImages(): Promise<AutoImageGalleryList> {
        return this.get("my_list", {mode: "all"});
    }

    /** 자동짤 사용/랜덤 여부를 바꿉니다. `random: true`면 랜덤, 아니면 사용 여부입니다. (`autozzal/setting`) */
    setting(enabled: boolean, options: { random?: boolean; gallery?: string } = {}): Promise<AutoImageSettingResult> {
        return this.post("setting", {mode: options.random ? "random" : "use", use: enabled, id: options.gallery ?? GLOBAL});
    }

    /** 대표 자동짤을 정합니다. (`autozzal/main_image`) */
    setMain(image: string, gallery = GLOBAL): Promise<AutoImageSettingResult> {
        return this.post("main_image", {id: gallery, img: image});
    }

    /** 자동짤을 추가합니다. (`autozzal/insert`) */
    add(images: string[], gallery = GLOBAL): Promise<ApiResult> {
        return this.post("insert", {id: gallery, ...indexed("img", images)});
    }

    /** 갤러리에서 자동짤을 뺍니다. (`autozzal/delete`) */
    remove(images: string[], gallery = GLOBAL): Promise<ApiResult> {
        return this.post("delete", {id: gallery, ...indexed("img", images)});
    }

    /** 내 자동짤 이미지를 완전히 지웁니다. (`autozzal/my_delete`) */
    removeMine(images: string[]): Promise<ApiResult> {
        return this.post("my_delete", indexed("img", images));
    }

    private async get<T>(path: string, query: Fields): Promise<T> {
        return this.http.get(`${HOST.app}/api/autozzal/${path}`, {confirm_id: this.requireLogin().userId, client_id: await this.clientToken(), ...query});
    }

    private async post<T>(path: string, fields: Fields): Promise<T> {
        return this.http.post(`${HOST.app}/api/autozzal/${path}`, {confirm_id: this.requireLogin().userId, client_id: await this.clientToken(), ...fields});
    }
}
