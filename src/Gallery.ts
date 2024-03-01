import {Dcinside} from "./Dcinside.js";
import {GalleryType} from "./@types/GalleryType.js";
import {Article} from "./Article.js";

export class Gallery {
    public readonly article: Article;

    constructor(
        private readonly dcinside: Dcinside,
        private readonly type: GalleryType,
        private readonly id: string
    ) {
        this.article = new Article(this.dcinside, this.type, this.id);
    }
}