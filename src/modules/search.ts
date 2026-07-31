import {type KyHttpClient, postMultipartJson} from "../core/http";
import {API_URL} from "../core/http/constants";
import {objectValue} from "../core/http/json";
import type {GallerySearchResult, TotalSearchResult} from "../core/types";

/**
 * 갤러리 검색과 통합 검색 흐름을 처리합니다.
 */
export class SearchManager {
    constructor(private readonly http: KyHttpClient) {
    }

    /** 키워드로 갤러리(메인/마이너/미니/추천)를 검색. */
    async galleries(keyword: string): Promise<GallerySearchResult> {
        const response = await postMultipartJson(this.http, API_URL.search.search, {keyword});
        return objectValue(response) as unknown as GallerySearchResult;
    }

    /** 통합 검색(갤러리/위키/게시글/실시간/동영상). */
    async total(keyword: string): Promise<TotalSearchResult> {
        const response = await postMultipartJson(this.http, API_URL.search.search, {
            keyword,
            search_type: "search_main"
        });
        return objectValue(response) as unknown as TotalSearchResult;
    }
}