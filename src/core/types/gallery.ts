/** 디시인사이드 갤러리 네임스페이스입니다. `mini`와 `person`은 요청 시 접두사를 자동으로 붙입니다. */
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

export interface GalleryInfo {
    title: string;
    category: number;
    fileCount: number;
    fileSize: number;
    noWrite: boolean;
    captcha: boolean | null;
    codeCount: number | null;
    useAiWrite: boolean | null;
    isMinor: boolean;
    isMini: boolean;
    isPerson: boolean;
    isManager: boolean;
    membership: boolean | null;
    profileImage: string | null;
    personGalleryImage: string | null;
    isPersonGalleryCertified: boolean | null;
    personGalleryProfile: Array<{ name: string; value: string }>;
    totalMember: number | null;
    memberJoin: boolean | null;
    useAutoDelete: number | null;
    useListFix: boolean | null;
    notifyRecent: number | null;
    headTextUpdatedAt: number | null;
    placeholders: Array<{ no: number; message: string }>;
    mustRead: { articleId: number; subject: string } | null;
    anonymousNickname: string | null;
    captureNickname: string | null;
    galleryNickname: string | null;
    relationGallery: Record<string, string>;
    headTexts: HeadText[];
}

export type RankingType = "up" | "down" | "stop" | "unknown";

export interface GalleryRankingItem {
    galleryLink: string;
    galleryId: string;
    galleryName: string;
    rankType: RankingType;
    rank: number;
    rankDelta: number;
}

export interface MinorGalleryInfo {
    id: string;
    koName: string;
    image: string | null;
    description: string | null;
    manager: GalleryManagerSummary;
    subManagers: GalleryManagerSummary[];
    createDate: string;
    isNew: boolean;
    hotState: string;
    totalCount: string;
    categoryName: string;
    mini: MiniGalleryInfo | null;
    person: {
        history: Array<{
            date: string;
            manager: string;
            content: string;
        }>;
    } | null;
}

export interface MiniGalleryInfo {
    hide: boolean;
    totalMember?: number;
    memberLimit?: number;
    isMember?: boolean;
}

export interface GalleryManagerSummary {
    id: string;
    name: string;
}

export interface MainPageHitArticle {
    galleryId: string;
    articleId: number;
    title: string;
    galleryAlias: string | null;
    thumbnail: string;
}

export interface MainPageLiveBestArticle {
    galleryId: string;
    articleId: number;
    galleryName: string;
    title: string;
    comment: string;
    hit: number;
    recommend: number;
    isTop: boolean;
    regTime: string;
    thumbnail: string;
    category: string;
    gallAlias: string | null;
}

export interface MainPageResult {
    hit: MainPageHitArticle[];
    livebest: MainPageLiveBestArticle[];
    new_gallery: Gallery[];
}