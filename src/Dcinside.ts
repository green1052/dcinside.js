import got, {Got} from "got";
import {CookieJar} from "tough-cookie";
import {Auth} from "./Auth.js";
import AnonymousUser from "./user/AnonymousUser.js";
import LoginUser from "./user/LoginUser.js";
import {Gallery} from "./Gallery.js";
import {GalleryType} from "./@types/GalleryType.js";

export class Dcinside {
    public readonly cookieJar = new CookieJar();
    public readonly client: Got = got.extend({
        cookieJar: this.cookieJar,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
        }
    });
    public readonly auth = new Auth(this);

    constructor(public readonly user: AnonymousUser | LoginUser) {
    }

    public gallery(type: GalleryType, id: string) {
        return new Gallery(this, type, id);
    }
}