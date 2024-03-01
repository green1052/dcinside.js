import {Dcinside} from "./Dcinside.js";
import {GalleryType} from "./@types/GalleryType.js";
import {baseUrl} from "./util/baseUrl.js";
import * as cheerio from "cheerio";

export class ArticleInfo {
    constructor(
        private readonly dcinside: Dcinside,
        private readonly type: GalleryType,
        private readonly id: string,
        private readonly no: string
    ) {

    }

    public async load() {
        const response = await this.dcinside.client.get(`${baseUrl(this.type)}/view/?id=${this.id}&no=${this.no}`);
        const $ = cheerio.load(response.body);

        const headText = $(".title_headtext").text();
        const subject = $(".title_subject").text();
        const isMobile = $(".icon_write_app").length > 0;


        return;
    }
}