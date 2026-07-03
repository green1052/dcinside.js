import {type KyHttpClient, postMultipartJson} from "../../core/http";
import {API_URL} from "../../core/http/constants";
import {arrayValue, booleanValue, firstObject, numberValue, objectValue, stringValue} from "../../core/http/json";
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
} from "../../core/types";

/**
 * 내 갤러리, 관리 갤러리, 미니 갤러리 가입과 탈퇴 흐름을 처리합니다.
 *
 * 모든 요청에는 상세 정보가 포함된 로그인 세션이 필요합니다.
 */
export class UserManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly getSession: () => Session | null
    ) {
    }

    /**
     * 내 갤러리와 즐겨찾기 목록을 불러옵니다.
     *
     * @returns 내 갤러리 목록과 즐겨찾기 갤러리 목록입니다.
     */
    async myGalleries(): Promise<MyGalleryResult> {
        const json = await this.uploadUser(API_URL.user.myGall);
        return {
            myGallery: arrayValue(json["mygall"]).map(mapGallery),
            favorite: arrayValue(json["favori"]).map(mapGallery)
        };
    }

    /**
     * 갤러리를 즐겨찾기에 추가합니다.
     *
     * @param gallery 즐겨찾기에 추가할 갤러리 ID와 이름입니다.
     * @returns 즐겨찾기 수정 성공 여부와 서버 메시지입니다.
     */
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

    /**
     * 내가 관리 중인 갤러리 목록을 불러옵니다.
     *
     * @returns 관리 중인 갤러리 목록입니다.
     */
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

    /**
     * 가입, 대기, 탈퇴 상태의 미니 갤러리 목록을 불러옵니다.
     *
     * @returns 상태별 미니 갤러리 목록입니다.
     */
    async joinedMiniGalleries(): Promise<JoinedMiniGalleryResult> {
        const json = await this.uploadUser(API_URL.user.myMiniJoinCheck);
        return {
            joined: arrayValue(json["myjoinmini_in"]).map(mapJoinedMiniGallery),
            pending: arrayValue(json["myjoinmini_hold"]).map(mapJoinedMiniGallery),
            left: arrayValue(json["myjoinmini_out"]).map(mapJoinedMiniGallery)
        };
    }

    /**
     * 미니 갤러리 가입 요청과 확인 요청을 순서대로 실행합니다.
     *
     * @param galleryId 가입할 미니 갤러리 ID입니다.
     * @returns 가입 요청 결과와 확인 요청 결과입니다.
     */
    async joinMiniGallery(galleryId: string): Promise<{
        join: MiniGalleryJoinResult;
        confirm: MiniGalleryJoinOkResult
    }> {
        const join = await this.requestMiniJoin(galleryId);
        const confirm = await this.confirmMiniJoin(galleryId);
        return {join, confirm};
    }

    /**
     * 미니 갤러리 가입을 요청합니다.
     *
     * @param galleryId 가입할 미니 갤러리 ID입니다.
     * @returns 가입 요청 성공 여부와 가입 질문입니다.
     */
    async requestMiniJoin(galleryId: string): Promise<MiniGalleryJoinResult> {
        const json = await this.uploadUser(API_URL.miniGallery.join, {id: galleryId});
        return {
            result: booleanValue(json["result"]),
            joinQuestion: stringValue(json["join_question"])
        };
    }

    /**
     * 미니 갤러리 가입을 확인합니다.
     *
     * @param galleryId 가입 확인할 미니 갤러리 ID입니다.
     * @returns 가입 확인 성공 여부와 서버 상태입니다.
     */
    async confirmMiniJoin(galleryId: string): Promise<MiniGalleryJoinOkResult> {
        const json = await this.uploadUser(API_URL.miniGallery.joinOk, {id: galleryId});
        return {
            result: booleanValue(json["result"]),
            cause: stringValue(json["cause"]),
            status: stringValue(json["status"])
        };
    }

    /**
     * 미니 갤러리에서 탈퇴합니다.
     *
     * @param galleryId 탈퇴할 미니 갤러리 ID입니다.
     * @returns 탈퇴 성공 여부입니다.
     */
    async quitMiniGallery(galleryId: string): Promise<MiniGalleryQuitResult> {
        const json = await this.uploadUser(API_URL.miniGallery.quit, {id: galleryId});
        return {
            result: booleanValue(json["result"])
        };
    }

    /** 유저 API multipart 요청을 전송하고 첫 번째 객체 응답으로 반환합니다. */
    private async uploadUser(url: string, multipart: Record<string, string | number | boolean | null | undefined> = {}): Promise<Record<string, unknown>> {
        this.requireLogin();
        const response = await postMultipartJson(this.http, url, multipart);
        return firstObject(response);
    }

    /** 상세 정보가 포함된 로그인 세션을 가져오거나 에러를 던집니다. */
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
