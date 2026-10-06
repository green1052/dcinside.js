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
    info(gallery: string, options: { main?: boolean } = {}): Promise<GalleryIntro> {
        return this.http.post(`${HOST.app}/api/${options.main ? "gall_info" : "minor_info"}`, {id: gallery, user_id: this.userId});
    }

    /** 인물 갤러리 프로필입니다. (`person_profile`) */
    personProfile(gallery: string): Promise<PersonGalleryProfile> {
        return this.http.get(`${HOST.app}/api/person_profile`, {id: gallery});
    }

    /** 갤로그 글/댓글 수입니다. (`usergallogcnt`) */
    gallogCount(userId: string): Promise<UserGallogCount> {
        return this.http.get(`${HOST.app}/api/usergallogcnt`, {g_id: userId});
    }

    /** 여러 갤러리의 현재 순위입니다. (`gallery_rank`) */
    rank(galleries: string[]): Promise<GalleryRankInfo> {
        return this.http.get(`${HOST.app}/api/gallery_rank`, {id: galleries.join(",")});
    }

    /** 갤러리 랭킹입니다. */
    ranking(kind: "main"): Promise<MajorGalleryRanking[]>;
    ranking(kind: Exclude<GalleryKind, "main">): Promise<MinorGalleryRanking[]>;
    ranking(kind: GalleryKind): Promise<MajorGalleryRanking[] | MinorGalleryRanking[]> {
        return this.http.get(`${HOST.json2}/${RANKING_PATH[kind]}`, {}, {list: true});
    }

    /** 흥한 갤러리 목록입니다. */
    hot(kind: GalleryKind): Promise<MinorGalleryRanking[]> {
        return this.http.get(HOT_URL[kind], {}, {list: true});
    }

    /** 카테고리별 추천 글 목록입니다. `key`는 앱 메인 탭 키입니다. (`json1/recommend/recommend_{key}.php`) */
    recommended(key: string): Promise<RecommendArticle[]> {
        return this.http.get(`${HOST.json2}/json1/recommend/recommend_${key}.php`, {}, {list: true});
    }

    /** 앱 메인 화면 구성(힛갤/이슈 등)입니다. (`main_content.php`) */
    main(): Promise<MainContent> {
        return this.http.get(`${HOST.json2}/json3/main_content.php`);
    }

    /** 실시간 베스트입니다. (`bestcontent/livebest`) */
    liveBest(): Promise<LiveBestArticle[]> {
        return this.http.get(`${HOST.app}/bestcontent/livebest`, {}, {list: true});
    }

    /** 갤러리 카테고리 목록입니다. (`category_name.php`) */
    categories(): Promise<GalleryCategory[]> {
        return this.http.get(`${HOST.json2}/json3/category_name.php`, {}, {list: true});
    }

    /** 전체 갤러리 이름 목록입니다. 크기가 큽니다. (`gall_name.php`) */
    names(): Promise<GalleryNameEntry[]> {
        return this.http.get(`${HOST.json2}/json3/gall_name.php`, {}, {list: true});
    }

    /** 펌 갤러리 정보입니다. (`pum/gall_info`) */
    pumInfo(gallery: string): Promise<PumGalleryInfo> {
        return this.http.get(`${HOST.app}/api/pum/gall_info`, {confirm_id: this.userId, id: gallery});
    }

    /** 글의 펌 이력입니다. (`pum/history`) */
    pumHistory(gallery: string, no: number): Promise<PumHistory> {
        return this.http.get(`${HOST.app}/api/pum/history`, {id: gallery, no});
    }

    /** 이미지/동영상 업로드 제한 여부입니다. 제한이면 `ApiError`가 납니다. (`chk_upload_restriction`) */
    uploadRestriction(gallery: string, kind: "img" | "movie"): Promise<ApiResult> {
        return this.http.get(`${HOST.app}/api/chk_upload_restriction`, {id: gallery, mode: kind});
    }
}
