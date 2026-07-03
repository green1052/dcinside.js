import type {GalleryType} from "../types";

const galleryPrefixes = {
    mini: "mi$",
    person: "pr$"
} as const;

/** 갤러리 타입을 생략하면 메인 갤러리로 처리합니다. */
export function normalizeGalleryType(type?: GalleryType): GalleryType {
    return type ?? "main";
}

/**
 * DCInside API에 전달할 갤러리 ID를 정규화합니다.
 *
 * @param galleryId 접두사가 없거나 이미 붙어 있는 갤러리 ID입니다.
 * @param type 갤러리 종류입니다. `mini`와 `person`은 각각 `mi$`, `pr$` 접두사를 붙입니다.
 * @returns API 요청에 바로 넣을 수 있는 갤러리 ID입니다.
 */
export function normalizeGalleryId(galleryId: string, type?: GalleryType): string {
    const resolved = normalizeGalleryType(type);
    if (resolved === "main" || resolved === "minor") return galleryId;

    const prefix = galleryPrefixes[resolved];
    return galleryId.startsWith(prefix) ? galleryId : `${prefix}${galleryId}`;
}

/**
 * 접두사가 포함된 갤러리 ID에서 갤러리 종류를 추론합니다.
 *
 * @param galleryId API용 갤러리 ID입니다.
 * @returns 접두사로 구분 가능한 갤러리 종류입니다. 일반 마이너 갤러리는 메인과 같은 형식이라 `main`으로 반환합니다.
 */
export function inferGalleryType(galleryId: string): GalleryType {
    if (galleryId.startsWith(galleryPrefixes.mini)) return "mini";
    if (galleryId.startsWith(galleryPrefixes.person)) return "person";
    return "main";
}
