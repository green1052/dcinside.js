import {Dcinside} from "./Dcinside.js";
import {GalleryType} from "./@types/GalleryType.js";
import {ArticleInfo} from "./ArticleInfo.js";

export class Article {
    constructor(
        private readonly dcinside: Dcinside,
        private readonly type: GalleryType,
        private readonly id: string
    ) {

    }

    public async get(no: string) {
        const articleInfo = new ArticleInfo(this.dcinside, this.type, this.id, no);
        await articleInfo.load();

        return articleInfo;
    }

    public async write() {

    }

    public async delete() {

    }

    public async edit() {

    }

    public async vote() {

    }


}