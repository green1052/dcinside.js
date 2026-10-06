import {HOST} from "../constants";
import type {
    ApiResult,
    GalleryCategory,
    GalleryIntro,
    GalleryNameEntry,
    GalleryRankInfo,
    LiveBestArticle,
    MainContent,
    MajorGalleryRanking,
    MinorGalleryRanking,
    PersonGalleryProfile,
    PumGalleryInfo,
    PumHistory,
    RecommendArticle,
    UserGallogCount
} from "../types/responses";
import {Api} from "./context";

/** 랭킹/흥한 갤러리 종류입니다. */
export type GalleryKind = "main" | "minor" | "mini" | "person";

const RANKING_PATH: Record<GalleryKind, string> = {
    main: "json1/ranking_gallery.php",
    minor: "json1/mgallmain/mgallery_ranking.php",
    mini: "json1/migallmain/migallery_ranking.php",
    person: "json1/prgallmain/prgallery_ranking.php"
};

const HOT_URL: Record<GalleryKind, string> = {
    main: `${HOST.json}/json0/gallmain/gallery_hot_day.php`,
    minor: `${HOST.json2}/json0/mgallmain/mgallery_hot.php`,
    mini: `${HOST.json}/json0/mgallmain/migallery_hot.php`,
    person: `${HOST.json}/json0/mgallmain/prgallery_hot.php`
};

/**
 * 갤러리 정보, 랭킹, 앱 메인 화면 데이터입니다. 모두 세션 없이 쓸 수 있습니다.
 */
export class GalleryApi extends Api {
    /** 갤러리 소개/매니저/미니갤 정보입니다. 메인 갤러리는 `main: true`를 넘기세요. (`minor_info`, `gall_info`) */
    async info(gallery: string, options: { main?: boolean } = {}): Promise<GalleryIntro> {
        return this.post("GalleryIntro", `${HOST.app}/api/${options.main ? "gall_info" : "minor_info"}`, {id: gallery, user_id: this.userId});
    }

    /** 인물 갤러리 프로필입니다. (`person_profile`) */
    async personProfile(gallery: string): Promise<PersonGalleryProfile> {
        return this.get("PersonGalleryProfile", `${HOST.app}/api/person_profile`, {id: gallery});
    }

    /** 갤로그 글/댓글 수입니다. (`usergallogcnt`) */
    async gallogCount(userId: string): Promise<UserGallogCount> {
        return this.get("UserGallogCount", `${HOST.app}/api/usergallogcnt`, {g_id: userId});
    }

    /** 여러 갤러리의 현재 순위입니다. (`gallery_rank`) */
    async rank(galleries: string[]): Promise<GalleryRankInfo> {
        return this.get("GalleryRankInfo", `${HOST.app}/api/gallery_rank`, {id: galleries.join(",")});
    }

    /** 갤러리 랭킹입니다. */
    ranking(kind: "main"): Promise<MajorGalleryRanking[]>;
    ranking(kind: Exclude<GalleryKind, "main">): Promise<MinorGalleryRanking[]>;
    async ranking(kind: GalleryKind): Promise<MajorGalleryRanking[] | MinorGalleryRanking[]> {
        const url = `${HOST.json2}/${RANKING_PATH[kind]}`;
        return kind === "main" ? this.getList("MajorGalleryRanking", url) : this.getList("MinorGalleryRanking", url);
    }

    /** 흥한 갤러리 목록입니다. */
    async hot(kind: GalleryKind): Promise<MinorGalleryRanking[]> {
        return this.getList("MinorGalleryRanking", HOT_URL[kind]);
    }

    /** 카테고리별 추천 글 목록입니다. `key`는 앱 메인 탭 키입니다. (`json1/recommend/recommend_{key}.php`) */
    async recommended(key: string): Promise<RecommendArticle[]> {
        return this.getList("RecommendArticle", `${HOST.json2}/json1/recommend/recommend_${key}.php`);
    }

    /** 앱 메인 화면 구성(힛갤/이슈 등)입니다. (`main_content.php`) */
    async main(): Promise<MainContent> {
        return this.get("MainContent", `${HOST.json2}/json3/main_content.php`);
    }

    /** 실시간 베스트입니다. (`bestcontent/livebest`) */
    async liveBest(): Promise<LiveBestArticle[]> {
        return this.getList("LiveBestArticle", `${HOST.app}/bestcontent/livebest`);
    }

    /** 갤러리 카테고리 목록입니다. (`category_name.php`) */
    async categories(): Promise<GalleryCategory[]> {
        return this.getList("GalleryCategory", `${HOST.json2}/json3/category_name.php`);
    }

    /** 전체 갤러리 이름 목록입니다. 크기가 큽니다. (`gall_name.php`) */
    async names(): Promise<GalleryNameEntry[]> {
        return this.getList("GalleryNameEntry", `${HOST.json2}/json3/gall_name.php`);
    }

    /** 펌 갤러리 정보입니다. (`pum/gall_info`) */
    async pumInfo(gallery: string): Promise<PumGalleryInfo> {
        return this.get("PumGalleryInfo", `${HOST.app}/api/pum/gall_info`, {confirm_id: this.userId, id: gallery});
    }

    /** 글의 펌 이력입니다. (`pum/history`) */
    async pumHistory(gallery: string, no: number): Promise<PumHistory> {
        return this.get("PumHistory", `${HOST.app}/api/pum/history`, {id: gallery, no});
    }

    /** 이미지/동영상 업로드 제한 여부입니다. 제한이면 `ApiError`가 납니다. (`chk_upload_restriction`) */
    async uploadRestriction(gallery: string, kind: "img" | "movie"): Promise<ApiResult> {
        return this.get("ApiResult", `${HOST.app}/api/chk_upload_restriction`, {id: gallery, mode: kind});
    }
}
