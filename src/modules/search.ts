import {type KyHttpClient, postMultipartJson} from "../core/http";
import {API_URL} from "../core/http/constants";
import {arrayValue, booleanValue, numberValue, objectValue, stringValue} from "../core/http/json";
import type {Gallery, GallerySearchResult, GalleryType, SearchArticle, TotalSearchResult} from "../core/types";

/**
 * 갤러리 검색과 통합 검색 흐름을 처리합니다.
 */
export class SearchManager {
    constructor(private readonly http: KyHttpClient) {
    }

    /** 키워드로 갤러리(메인/마이너/미니/추천)를 검색. */
    async galleries(keyword: string): Promise<GallerySearchResult> {
        const json = await this.request(keyword);
        return {
            mainGallery: mapGalleries(json["main_gall"], "main"),
            minorGallery: mapGalleries(json["minor_gall"], "minor"),
            miniGallery: mapGalleries(json["mini_gall"], "mini"),
            mainRecommendGallery: mapGalleries(json["main_recomm_gall"], "main"),
            minorRecommendGallery: mapGalleries(json["minor_recomm_gall"], "minor"),
            miniRecommendGallery: mapGalleries(json["mini_recomm_gall"], "mini"),
            allowFlag: booleanValue(json["allowFlag"])
        };
    }

    /** 통합 검색(갤러리/위키/게시글/실시간/동영상). */
    async total(keyword: string): Promise<TotalSearchResult> {
        const json = await this.request(keyword, {search_type: "search_main"});
        return {
            mainGallery: mapGalleries(json["main_gall"], "main"),
            minorGallery: mapGalleries(json["minor_gall"], "minor"),
            miniGallery: mapGalleries(json["mini_gall"], "mini"),
            wiki: arrayValue(json["wiki"]).map((item) => {
                const object = objectValue(item);
                return {
                    title: stringValue(object["title"]),
                    galleryName: stringValue(object["gall_name"]),
                    url: stringValue(object["url"])
                };
            }),
            board: mapArticles(json["board"]),
            todayIssue: mapArticles(json["today"]),
            realTime: arrayValue(json["realtime"]).map((item) => {
                const object = objectValue(item);
                return {
                    rank: numberValue(object["rank"]),
                    title: stringValue(object["title"]),
                    url: stringValue(object["url"])
                };
            }),
            movie: mapArticles(json["movie"]),
            allowFlag: booleanValue(json["allowFlag"])
        };
    }

    /** 검색 API multipart 요청을 전송합니다. */
    private async request(keyword: string, extra: Record<string, string> = {}): Promise<Record<string, unknown>> {
        const response = await postMultipartJson(this.http, API_URL.search.search, {
            keyword,
            ...extra
        });
        return objectValue(response);
    }
}

function mapGalleries(value: unknown, type: GalleryType): Gallery[] {
    return arrayValue(value).map((item) => {
        const object = objectValue(item);
        return {
            title: stringValue(object["title"]),
            id: stringValue(object["id"]),
            type
        };
    });
}

function mapArticles(value: unknown): SearchArticle[] {
    return arrayValue(value).map((item) => {
        const object = objectValue(item);
        return {
            title: stringValue(object["title"]),
            content: stringValue(object["content"]),
            galleryId: stringValue(object["id"]),
            galleryName: stringValue(object["gall_name"]),
            articleId: numberValue(object["no"]),
            regDate: stringValue(object["regdate"])
        };
    });
}
