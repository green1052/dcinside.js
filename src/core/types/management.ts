import type {GalleryTarget} from "./gallery";

export interface ManagerActionOptions {
    galleryId: string;
    articleId: number;
}

export interface ChangeHeadTextOptions extends ManagerActionOptions {
    headTextId: number;
}

export interface ManagerActionResult {
    result: boolean;
    cause: string;
    state: string | null;
}

export type BlockCategory = "obscene" | "advertisement" | "cussWords" | "spamming" | "piracy" | "defamation" | "custom";

export interface UserBlockOptions extends ManagerActionOptions {
    commentId?: number;
    blockHour?: number;
    category?: BlockCategory;
    reason?: string;
}

export interface UserBlockResult {
    result: boolean;
    cause: string;
}

export interface NoMemberBlockOptions {
    galleryId: string;
    proxyUntil?: Date;
    cellularUntil?: Date;
    image?: {
        until: Date;
        status: "" | "A" | "P" | "M" | "P,M";
    };
}

/** 비회원 차단 설정 응답 원본입니다. */
export interface NoMemberBlockResult {
    result: boolean;
    msg: string;
}

export type MovieUploadOptions = GalleryTarget & {
    file: Blob | File;
    checkRestriction?: boolean;
};

/** 영상 업로드 응답 원본입니다. */
export interface MovieUploadResult {
    msg: string | null;
    file_no: number | null;
    thum_url_arr: string[] | null;
    width: number | null;
    height: number | null;
}