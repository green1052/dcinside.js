import {type KyHttpClient, postMultipartJson} from "../core/http";
import {API_URL} from "../core/http/constants";
import {inferGalleryType} from "../core/http/gallery-id";
import {
    arrayValue,
    booleanValue,
    firstObject,
    nullableNumber,
    nullableString,
    numberValue,
    objectValue,
    stringValue
} from "../core/http/json";
import type {
    Gallery,
    GalleryManagerSummary,
    GalleryRankingItem,
    MainPageHitArticle,
    MainPageLiveBestArticle,
    MainPageResult,
    MinorGalleryInfo,
    MovieUploadOptions,
    MovieUploadResult,
    RankingType
} from "../core/types";

/**
 * 갤러리 정보, 앱 메인 페이지, 영상 업로드, 랭킹 흐름을 처리합니다.
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

    /**
     * 마이너 갤러리 정보를 불러옵니다.
     *
     * @param galleryId 마이너 갤러리 ID입니다.
     * @returns 갤러리 소개, 매니저, 회원 정보입니다.
     */
    async minorInfo(galleryId: string): Promise<MinorGalleryInfo> {
        const galleryType = inferGalleryType(galleryId);
        const response = await postMultipartJson(this.http, API_URL.gallery.minorInfo, {id: galleryId});
        const json = firstObject(response);

        const mini = objectValue(json["mini"]);
        const person = objectValue(json["person"]);

        return {
            id: stringValue(json["id"]),
            koName: stringValue(json["ko_name"]),
            image: nullableString(json["img"]),
            description: nullableString(json["mgallery_desc"]),
            manager: {
                id: stringValue(json["master_id"]),
                name: stringValue(json["master_name"])
            },
            subManagers: arrayValue(json["submanager"]).map(mapGalleryManager),
            createDate: stringValue(json["create_dt"]),
            isNew: booleanValue(json["new"]),
            hotState: stringValue(json["hot_state"]),
            totalCount: stringValue(json["total_count"]),
            categoryName: stringValue(json["cate_name"]),
            mini: galleryType === "mini"
                ? {
                    hide: booleanValue(mini["gall_hide"]),
                    totalMember: nullableNumber(mini["total_member"]) ?? undefined,
                    memberLimit: nullableNumber(mini["member_limit"]) ?? undefined,
                    isMember: booleanValue(mini["member_ok"])
                } : null,
            person: galleryType === "person" ? parsePersonGalleryInfo(person) : null
        };
    }

    /**
     * 앱 메인 페이지 구성을 불러옵니다.
     *
     * @returns 히트글, 베스트글, 이슈줌, 신규 갤러리 목록입니다.
     */
    async mainPage(): Promise<MainPageResult> {
        const response = await this.http.ky.get(API_URL.mainInfo.appMain).json();

        const json = firstObject(response);
        return {
            hit: arrayValue(json["hit"]).map(mapHitArticle),
            livebest: arrayValue(json["livebest"]).map(mapLiveBestArticle),
            new_gallery: arrayValue(json["new_gallery"]).map(mapNewGallery)
        };
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
        const json = objectValue(response);
        return {
            message: nullableString(json["msg"]),
            fileId: nullableNumber(json["file_no"]),
            thumbnailUrls: json["thum_url_arr"] == null ? null : arrayValue(json["thum_url_arr"]).map((item) => stringValue(item)),
            width: nullableNumber(json["width"]),
            height: nullableNumber(json["height"])
        };
    }

    /** 메인, 마이너, 미니, 인물 갤러리 랭킹을 불러옵니다. */
    private async ranking(url: string, kind: "main" | "minor" | "mini" | "person"): Promise<GalleryRankingItem[]> {
        const text = await this.http.ky.get(url).text();
        const response = parseRankingResponse(text);
        return arrayValue(response).map((item) => {
            const object = objectValue(item);
            const isMain = kind === "main";
            return {
                galleryLink: stringValue(object["link"]),
                galleryId: stringValue(object["id"]),
                galleryName: stringValue(isMain ? object["category"] : object["ko_name"]),
                rankType: mapRankType(object["rank_type"]),
                rank: numberValue(isMain ? object["num"] : object["rank"]),
                rankDelta: numberValue(isMain ? object["rank"] : object["rank_updown"])
            };
        });
    }
}

function mapGalleryManager(value: unknown): GalleryManagerSummary {
    const object = objectValue(value);
    return {
        id: stringValue(object["id"]),
        name: stringValue(object["name"])
    };
}

/** 인물 갤러리 `person` 객체를 안전하게 파싱합니다. 빈 객체면 `null`을 반환합니다. */
function parsePersonGalleryInfo(person: Record<string, unknown>): MinorGalleryInfo["person"] {
    const history = Array.isArray(person["history"]) ? person["history"].map((entry) => {
        const item = objectValue(entry);
        return {
            date: stringValue(item["date"]),
            manager: stringValue(item["manager"]),
            content: stringValue(item["content"])
        };
    }) : [];
    if (history.length === 0 && Object.keys(person).length === 0) return null;
    return {history};
}

function mapHitArticle(value: unknown): MainPageHitArticle {
    const object = objectValue(value);
    return {
        galleryId: stringValue(object["id"]),
        articleId: numberValue(object["no"]),
        title: stringValue(object["title"]),
        galleryAlias: nullableString(object["gall_alias"]),
        thumbnail: stringValue(object["thumbnail"])
    };
}

function mapLiveBestArticle(value: unknown): MainPageLiveBestArticle {
    const object = objectValue(value);
    return {
        galleryId: stringValue(object["id"]),
        articleId: numberValue(object["no"]),
        galleryName: stringValue(object["gall_name"]),
        title: stringValue(object["title"]),
        comment: stringValue(object["comment"]),
        hit: numberValue(object["hit"]),
        recommend: numberValue(object["recommend"]),
        isTop: booleanValue(object["is_top"]),
        regTime: stringValue(object["reg_time"]),
        thumbnail: stringValue(object["thumbnail"]),
        category: stringValue(object["category"]),
        gallAlias: nullableString(object["gall_alias"])
    };
}

function mapNewGallery(value: unknown): Gallery {
    const object = objectValue(value);
    return {
        id: stringValue(object["id"]),
        title: stringValue(object["title"])
    };
}

function mapRankType(value: unknown): RankingType {
    if (value === "up" || value === "down" || value === "stop") return value;
    return "unknown";
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