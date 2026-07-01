import type {GalleryType} from "../types";

const galleryPrefixes = {
    mini: "mi$",
    person: "pr$"
} as const;

/** galleryType이 주어지지 않으면 "main"으로 취급한다. */
export function normalizeGalleryType(type?: GalleryType): GalleryType {
    return type ?? "main";
}

export function normalizeGalleryId(galleryId: string, type?: GalleryType): string {
    const resolved = normalizeGalleryType(type);
    if (resolved === "main" || resolved === "minor") return galleryId;

    const prefix = galleryPrefixes[resolved];
    return galleryId.startsWith(prefix) ? galleryId : `${prefix}${galleryId}`;
}

export function inferGalleryType(galleryId: string): GalleryType {
    if (galleryId.startsWith(galleryPrefixes.mini)) return "mini";
    if (galleryId.startsWith(galleryPrefixes.person)) return "person";
    return "main";
}