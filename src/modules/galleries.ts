import {type KyHttpClient, postMultipartJson} from "../core/http";
import {API_URL} from "../core/http/constants";
import {arrayValue, booleanValue, firstObject, nullableString, objectValue} from "../core/http/json";
import type {
    Gallery,
    GalleryRankingItem,
    MainPageResult,
    MinorGalleryInfo,
    MovieUploadOptions,
    MovieUploadResult
} from "../core/types";

/**
 * 갤러리 정보, 앱 메인 페이지, 영상 업로드, 랭킹 흐름을 처리합니다.
 */
export class GalleryManager {
    readonly rankings = {
        main: () => this.ranking(API_URL.mainInfo.galleryRanking),
        minor: () => this.ranking(API_URL.mainInfo.minorGalleryRanking),
        mini: () => this.ranking(API_URL.mainInfo.miniGalleryRanking),
        person: () => this.ranking(API_URL.mainInfo.personGalleryRanking)
    };

    constructor(private readonly http: KyHttpClient) {
    }

    /**
     * 마이너 갤러리 정보를 불러옵니다.
     *
     * @param galleryId 마이너 갤러리 ID입니다.
     * @returns 갤러리 소개, 매니저, 회원 정보입니다.
     */
    async minorInfo(galleryId: string): Promise<MinorGalleryInfo> {
        const response = await postMultipartJson(this.http, API_URL.gallery.minorInfo, {id: galleryId});
        return firstObject(response) as unknown as MinorGalleryInfo;
    }

    /**
     * 앱 메인 페이지 구성을 불러옵니다.
     *
     * @returns 히트글, 베스트글, 이슈줌, 신규 갤러리 목록입니다.
     */
    async mainPage(): Promise<MainPageResult> {
        const response = await this.http.ky.get(API_URL.mainInfo.appMain).json();
        return firstObject(response) as unknown as MainPageResult;
    }

    /**
     * 게시글에 첨부할 영상을 업로드합니다.
     *
     * @param options 대상 갤러리, 영상 파일, 업로드 제한 확인 여부입니다.
     * @returns 업로드된 파일 번호, 썸네일, 영상 크기 정보입니다.
     */
    async uploadMovie(options: MovieUploadOptions): Promise<MovieUploadResult> {
        const galleryId = options.gallery;

        if (options.checkRestriction ?? true) {
            const url = new URL(API_URL.upload.checkUploadRestriction);
            url.searchParams.set("id", galleryId);
            url.searchParams.set("mode", "movie");
            const check = objectValue(await this.http.ky.get(url.toString()).json());
            if (!booleanValue(check["result"])) {
                throw new Error(nullableString(check["cause"]) ?? "Movie upload is restricted.");
            }
        }

        const response = await postMultipartJson(this.http, API_URL.upload.movie, {
            id: galleryId,
            avatar: options.file
        });
        return objectValue(response) as unknown as MovieUploadResult;
    }

    /** 메인, 마이너, 미니, 인물 갤러리 랭킹을 불러옵니다. */
    private async ranking(url: string): Promise<GalleryRankingItem[]> {
        const text = await this.http.ky.get(url).text();
        const response = parseRankingResponse(text);
        return arrayValue(response) as unknown as GalleryRankingItem[];
    }
}

/** 랭킹 응답은 JSON이 아닌 JS 배열 `([...])` 형태로 오므로 괄호를 벗겨 파싱합니다. 파싱 실패 시 빈 배열을 반환합니다. */
function parseRankingResponse(text: string): unknown {
    const trimmed = text.trim();
    const body = trimmed.startsWith("(") && trimmed.endsWith(")") ? trimmed.slice(1, -1) : trimmed;
    try {
        return JSON.parse(body);
    } catch {
        return [];
    }
}