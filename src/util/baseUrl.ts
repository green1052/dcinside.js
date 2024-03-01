import {GalleryType} from "../@types/GalleryType.js";

export function baseUrl(type: GalleryType): string {
    return `https://gall.dcinside.com/${type === "gallery" ? "" : `${type}/`}board`;
}