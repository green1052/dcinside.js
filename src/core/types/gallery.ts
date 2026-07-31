/** 디시인사이드 갤러리 네임스페이스입니다. `mini`와 `person` 갤러리 ID에는 `mi$`, `pr$` 접두사가 필요하며, `normalizeGalleryId`로 붙일 수 있습니다. */
export type GalleryType = "main" | "minor" | "mini" | "person";

export interface Gallery {
    id: string;
    title: string;
    type?: GalleryType;
}

export interface GalleryTarget {
    /** 요청 대상 갤러리 ID입니다. 예: `football_new9`, `krstock`, `mi$bjwg64`, `pr$dororong` */
    gallery: string;
}

export interface HeadText {
    no: string | number;
    name: string;
    level: number;
    selected: boolean;
    recommUnused?: boolean;
}


export type RankingType = "up" | "down" | "stop" | "unknown";

/** 갤러리 랭킹 항목 원본입니다. `kind`에 따라 일부 키만 존재합니다. */
export interface GalleryRankingItem {
    link?: string;
    id?: string;
    category?: string;
    ko_name?: string;
    rank_type?: string;
    num?: number;
    rank?: number;
    rank_updown?: number;
}

/** 마이너 갤러리 정보 원본입니다. */
export interface MinorGalleryInfo {
    id: string;
    ko_name: string;
    img: string | null;
    mgallery_desc: string | null;
    master_id: string;
    master_name: string;
    submanager: Array<{ id: string; name: string }>;
    create_dt: string;
    new: boolean;
    hot_state: string;
    total_count: string;
    cate_name: string;
    mini: MiniGalleryInfo | Record<string, never>;
    person: {
        history: Array<{ date: string; manager: string; content: string }>;
    } | Record<string, never>;
}

/** 미니 갤러리 정보 원본입니다. */
export interface MiniGalleryInfo {
    gall_hide: boolean;
    total_member?: number;
    member_limit?: number;
    member_ok?: boolean;
}

export interface MainPageHitArticle {
    id: string;
    no: number;
    title: string;
    gall_alias: string | null;
    thumbnail: string;
}

export interface MainPageLiveBestArticle {
    id: string;
    no: number;
    gall_name: string;
    title: string;
    comment: string;
    hit: number;
    recommend: number;
    is_top: boolean;
    reg_time: string;
    thumbnail: string;
    category: string;
    gall_alias: string | null;
}

export interface MainPageResult {
    hit: MainPageHitArticle[];
    livebest: MainPageLiveBestArticle[];
    new_gallery: Gallery[];
}