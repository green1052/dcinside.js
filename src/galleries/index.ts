import {type KyHttpClient, postMultipartJson} from "../http";
import {API_URL} from "../http/constants";
import {normalizeGalleryId} from "../http/gallery-id";
import {
    arrayValue,
    booleanValue,
    firstObject,
    nullableNumber,
    nullableString,
    numberValue,
    objectValue,
    stringValue
} from "../http/json";
import type {
    GalleryManagerInfo,
    GalleryRankingItem,
    MainPageArticle,
    MainPageResult,
    MinorGalleryInfo,
    MovieUploadOptions,
    MovieUploadResult,
    RankingType
} from "../types";

/**
 * 갤러리 매니저. 갤러리 정보/메인 페이지/영상 업로드/랭킹 흐름을 다룬다.
 */
export class GalleryManager {
    readonly rankings = {
        main: () => this.ranking(API_URL.mainInfo.galleryRanking, "main"),
        minor: () => this.ranking(API_URL.mainInfo.minorGalleryRanking, "minor"),
        mini: () => this.ranking(API_URL.mainInfo.miniGalleryRanking, "mini"),
        person: () => this.ranking(API_URL.mainInfo.personGalleryRanking, "person")
    };

    constructor(private readonly http: KyHttpClient) {
    }

    /** 마이너 갤러리 정보를 불러온다. */
    async minorInfo(galleryId: string): Promise<MinorGalleryInfo> {
        const response = await postMultipartJson(this.http, API_URL.gallery.minorInfo, {
            id: galleryId
        });
        const json = firstObject(response);
        const mini = objectValue(json["mini"]);

        return {
            id: stringValue(json["id"]),
            koName: stringValue(json["ko_name"]),
            image: nullableString(json["img"]),
            description: nullableString(json["mgallery_desc"]),
            manager: {
                isMaster: true,
                id: stringValue(json["master_id"]),
                name: stringValue(json["master_name"])
            },
            subManagers: arrayValue(json["submanager"]).map(mapGalleryManager),
            createDate: stringValue(json["create_dt"]),
            isNew: booleanValue(json["new"]),
            hotState: stringValue(json["hot_state"]),
            totalCount: stringValue(json["total_count"]),
            categoryName: stringValue(json["cate_name"]),
            mini: Object.keys(mini).length === 0
                ? null
                : {
                    hide: numberValue(mini["gall_hide"]),
                    totalMember: numberValue(mini["total_member"]),
                    memberLimit: numberValue(mini["member_limit"]),
                    isMember: booleanValue(mini["member_ok"])
                }
        };
    }

    /** 앱 메인 페이지(히트/베스트/이슈줌/신규 갤러리)를 불러온다. */
    async mainPage(): Promise<MainPageResult> {
        const response = await this.http.ky.get(API_URL.mainInfo.appMain).json();
        const json = firstObject(response);
        return {
            hit: arrayValue(json["hit"]).map(mapMainArticle),
            best: arrayValue(json["best"]).map(mapMainArticle),
            issueZoom: arrayValue(json["issuezoom"]).map(mapMainArticle),
            newGallery: arrayValue(json["new_gallery"]).map((item) => {
                const object = objectValue(item);
                return {
                    id: stringValue(object["id"]),
                    title: stringValue(object["title"])
                };
            })
        };
    }

    /** 영상을 업로드한다. checkRestriction(기본 true) 시 제한을 먼저 확인. */
    async uploadMovie(options: MovieUploadOptions): Promise<MovieUploadResult> {
        const galleryId = normalizeGalleryId(options.galleryId, options.galleryType);

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
        const json = objectValue(response);
        return {
            message: nullableString(json["msg"]),
            fileId: nullableNumber(json["file_no"]),
            thumbnailUrls: json["thum_url_arr"] == null ? null : arrayValue(json["thum_url_arr"]).map((item) => stringValue(item)),
            width: nullableNumber(json["width"]),
            height: nullableNumber(json["height"])
        };
    }

    /** 메인/마이너/미니/인물 갤러리 랭킹을 불러온다. */
    private async ranking(url: string, kind: "main" | "minor" | "mini" | "person"): Promise<GalleryRankingItem[]> {
        const text = await this.http.ky.get(url).text();
        const response = parseRankingResponse(text);
        return arrayValue(response).map((item) => {
            const object = objectValue(item);
            const isMainOrPerson = kind === "main" || kind === "person";
            return {
                galleryLink: stringValue(object["link"]),
                galleryId: stringValue(object["id"]),
                galleryName: stringValue(isMainOrPerson ? object["category"] : object["ko_name"]),
                rankType: mapRankType(object["rank_type"]),
                rank: numberValue(isMainOrPerson ? object["num"] : object["rank"]),
                rankDelta: numberValue(isMainOrPerson ? object["rank"] : object["rank_updown"])
            };
        });
    }
}

function mapGalleryManager(value: unknown): GalleryManagerInfo {
    const object = objectValue(value);
    return {
        isMaster: false,
        id: stringValue(object["id"]),
        name: stringValue(object["name"])
    };
}

function mapMainArticle(value: unknown): MainPageArticle {
    const object = objectValue(value);
    return {
        galleryId: stringValue(object["id"]),
        articleId: numberValue(object["no"]),
        galleryName: nullableString(object["gall_name"]),
        title: stringValue(object["title"]),
        thumbnail: stringValue(object["thumbnail"])
    };
}

function mapRankType(value: unknown): RankingType {
    if (value === "up" || value === "down" || value === "stop") return value;
    return "unknown";
}

/** 랭킹 응답은 JSON이 아닌 JS 배열 `([...])` 형태로 오므로 괄호를 벗겨 파싱. */
function parseRankingResponse(text: string): unknown {
    const trimmed = text.trim();
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
        return JSON.parse(trimmed.slice(1, -1));
    }
    return JSON.parse(trimmed);
}