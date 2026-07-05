import type {Gallery} from "./gallery";

export interface TotalSearchResult {
    mainGallery: Gallery[];
    minorGallery: Gallery[];
    miniGallery: Gallery[];
    wiki: SearchWikiItem[];
    board: SearchArticle[];
    todayIssue: SearchArticle[];
    realTime: SearchRealTimeItem[];
    movie: SearchArticle[];
    /** 검색 허용 여부입니다. 성인 갤러리 등에서 `false`일 수 있습니다. */
    allowFlag: boolean;
}

export interface SearchWikiItem {
    title: string;
    galleryName: string;
    url: string;
}

export interface SearchRealTimeItem {
    rank: number;
    title: string;
    url: string;
}

export interface SearchArticle {
    title: string;
    content: string;
    galleryId: string;
    galleryName: string;
    articleId: number;
    regDate: string;
}

export interface GallerySearchResult {
    mainGallery: Gallery[];
    minorGallery: Gallery[];
    miniGallery: Gallery[];
    mainRecommendGallery: Gallery[];
    minorRecommendGallery: Gallery[];
    miniRecommendGallery: Gallery[];
    /** 검색 허용 여부입니다. 성인 갤러리 등에서 `false`일 수 있습니다. */
    allowFlag: boolean;
}