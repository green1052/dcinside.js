import type {Gallery} from "./gallery";

export interface MyGalleryResult {
    myGallery: Gallery[];
    favorite: Gallery[];
}

export interface ManagedGallery {
    hide: number;
    id: string;
    title: string;
    type: string;
    managerType: string;
}

export interface JoinedMiniGallery {
    title: string;
    id: string;
    hide: number;
}

export interface JoinedMiniGalleryResult {
    joined: JoinedMiniGallery[];
    pending: JoinedMiniGallery[];
    left: JoinedMiniGallery[];
}

export interface ModifyMyGalleryResult {
    result: boolean;
    cause: string;
}

export interface MiniGalleryJoinResult {
    result: boolean;
    joinQuestion: string;
}

export interface MiniGalleryJoinOkResult {
    result: boolean;
    cause: string;
    status: string;
}

export interface MiniGalleryQuitResult {
    result: boolean;
}