import {type KyHttpClient, postMultipartJson} from "../http";
import {API_URL} from "../http/constants";
import {arrayValue, booleanValue, firstObject, numberValue, objectValue, stringValue} from "../http/json";
import type {
    Gallery,
    JoinedMiniGallery,
    JoinedMiniGalleryResult,
    ManagedGallery,
    MiniGalleryJoinOkResult,
    MiniGalleryJoinResult,
    MiniGalleryQuitResult,
    ModifyMyGalleryResult,
    MyGalleryResult,
    Session
} from "../types";

/**
 * 유저 매니저. 내 갤러리/관리 갤러리/미니 갤러리 가입·탈퇴 흐름을 다룬다.
 * 로그인 세션(상세 정보 포함)이 필요하다.
 */
export class UserManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly getSession: () => Session | null
    ) {
    }

    /** 내 갤러리와 즐겨찾기 목록을 불러온다. */
    async myGalleries(): Promise<MyGalleryResult> {
        const json = await this.uploadUser(API_URL.user.myGall);
        return {
            myGallery: arrayValue(json["mygall"]).map(mapGallery),
            favorite: arrayValue(json["favori"]).map(mapGallery)
        };
    }

    /** 갤러리를 즐겨찾기에 추가. */
    async addFavoriteGallery(gallery: Gallery): Promise<ModifyMyGalleryResult> {
        const json = await this.uploadUser(API_URL.user.myGallModify, {
            gall_nm: gallery.title,
            gall_id: gallery.id,
            mode: "favori_gall"
        });

        return {
            result: booleanValue(json["result"]),
            cause: stringValue(json["cause"])
        };
    }

    /** 내가 관리 중인 갤러리 목록을 불러온다. */
    async managedGalleries(): Promise<ManagedGallery[]> {
        const json = await this.uploadUser(API_URL.user.myManageGallCheck);
        return arrayValue(json["mymanageList"]).map((item) => {
            const object = objectValue(item);
            return {
                hide: numberValue(object["gall_hide"]),
                id: stringValue(object["gall_id"]),
                title: stringValue(object["gall_koname"]),
                type: stringValue(object["gall_type"]),
                managerType: stringValue(object["manager_type"])
            };
        });
    }

    /** 가입/대기/탈퇴한 미니 갤러리 목록을 불러온다. */
    async joinedMiniGalleries(): Promise<JoinedMiniGalleryResult> {
        const json = await this.uploadUser(API_URL.user.myMiniJoinCheck);
        return {
            joined: arrayValue(json["myjoinmini_in"]).map(mapJoinedMiniGallery),
            pending: arrayValue(json["myjoinmini_hold"]).map(mapJoinedMiniGallery),
            left: arrayValue(json["myjoinmini_out"]).map(mapJoinedMiniGallery)
        };
    }

    /** 미니 갤러리 가입 요청 + 확인을 한 번에 실행. */
    async joinMiniGallery(galleryId: string): Promise<{
        join: MiniGalleryJoinResult;
        confirm: MiniGalleryJoinOkResult
    }> {
        const join = await this.requestMiniJoin(galleryId);
        const confirm = await this.confirmMiniJoin(galleryId);
        return {join, confirm};
    }

    /** 미니 갤러리 가입 요청. */
    async requestMiniJoin(galleryId: string): Promise<MiniGalleryJoinResult> {
        const json = await this.uploadUser(API_URL.miniGallery.join, {id: galleryId});
        return {
            result: booleanValue(json["result"]),
            joinQuestion: stringValue(json["join_question"])
        };
    }

    /** 미니 갤러리 가입 확인. */
    async confirmMiniJoin(galleryId: string): Promise<MiniGalleryJoinOkResult> {
        const json = await this.uploadUser(API_URL.miniGallery.joinOk, {id: galleryId});
        return {
            result: booleanValue(json["result"]),
            cause: stringValue(json["cause"]),
            status: stringValue(json["status"])
        };
    }

    /** 미니 갤러리 탈퇴. */
    async quitMiniGallery(galleryId: string): Promise<MiniGalleryQuitResult> {
        const json = await this.uploadUser(API_URL.miniGallery.quit, {id: galleryId});
        return {
            result: booleanValue(json["result"])
        };
    }

    /** 유저 API multipart 공용 전송. firstObject로 래핑해 반환. */
    private async uploadUser(url: string, multipart: Record<string, string | number | boolean | null | undefined> = {}): Promise<Record<string, unknown>> {
        this.requireLogin();
        const response = await postMultipartJson(this.http, url, multipart);
        return firstObject(response);
    }

    /** 로그인(상세 포함) 세션을 요구하거나 에러를 던진다. */
    private requireLogin(): Session {
        const session = this.getSession();
        if (!session?.detail) {
            throw new Error("A logged-in session is required. Call client.login(...).");
        }
        return session;
    }
}

function mapGallery(value: unknown): Gallery {
    const object = objectValue(value);
    return {
        title: stringValue(object["gall_koname"]),
        id: stringValue(object["gall_id"])
    };
}

function mapJoinedMiniGallery(value: unknown): JoinedMiniGallery {
    const object = objectValue(value);
    return {
        title: stringValue(object["gall_koname"]),
        id: stringValue(object["gall_id"]),
        hide: numberValue(object["gall_hide"])
    };
}