import {ArticleManager, ScopedArticleEntryManager, type ScopedGalleryArticleManager} from "../modules/articles";
import {CommentManager, type ScopedArticleCommentManager} from "../modules/comments";

export type GalleryRef = string;

export class ArticleClient extends ScopedArticleEntryManager {
    readonly comments: ScopedArticleCommentManager;

    constructor(
        articles: ArticleManager,
        comments: CommentManager,
        gallery: string,
        articleId: number
    ) {
        super(articles, gallery, articleId);
        this.comments = comments.article(gallery, articleId);
    }
}

export class GalleryClient {
    readonly articles: ScopedGalleryArticleManager;
    readonly gallery: string;

    constructor(
        gallery: GalleryRef,
        private readonly articlesManager: ArticleManager,
        private readonly commentsManager: CommentManager
    ) {
        this.gallery = gallery;
        this.articles = articlesManager.gallery(gallery);
    }

    article(articleId: number): ArticleClient {
        return new ArticleClient(this.articlesManager, this.commentsManager, this.gallery, articleId);
    }
}