/** 검색 응답의 갤러리 항목 원본 형태입니다. `gall_state`는 마이너/미니/추천 갤러리에만 존재합니다. */
export interface SearchGalleryItem {
    title: string;
    id: string;
    gall_state?: string;
}

export interface GallerySearchResult {
    main_gall: SearchGalleryItem[];
    minor_gall: SearchGalleryItem[];
    mini_gall: SearchGalleryItem[];
    main_recomm_gall: SearchGalleryItem[];
    minor_recomm_gall: SearchGalleryItem[];
    mini_recomm_gall: SearchGalleryItem[];
    /** 검색 허용 여부입니다. 성인 갤러리 등에서 `false`일 수 있습니다. */
    allowFlag: boolean;
}

/** 통합 검색 게시글 항목입니다. `no`는 게시글 번호(문자열)입니다. */
export interface SearchArticle {
    title: string;
    content: string;
    id: string;
    gall_name: string;
    no: string;
    regdate: string;
}

export interface SearchWikiItem {
    title: string;
    gall_name: string;
    url: string;
}

export interface SearchRealTimeItem {
    rank: number;
    title: string;
    url: string;
}

export interface TotalSearchResult {
    main_gall: SearchGalleryItem[];
    minor_gall: SearchGalleryItem[];
    mini_gall: SearchGalleryItem[];
    wiki: SearchWikiItem[];
    board: SearchArticle[];
    today: SearchArticle[];
    realtime: SearchRealTimeItem[];
    movie: SearchArticle[];
    /** 검색 허용 여부입니다. 성인 갤러리 등에서 `false`일 수 있습니다. */
    allowFlag: boolean;
}