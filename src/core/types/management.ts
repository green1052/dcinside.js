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

export interface NoMemberBlockResult {
    result: boolean;
    message: string;
}

export type MovieUploadOptions = GalleryTarget & {
    file: Blob | File;
    checkRestriction?: boolean;
};

export interface MovieUploadResult {
    message: string | null;
    fileId: number | null;
    thumbnailUrls: string[] | null;
    width: number | null;
    height: number | null;
}