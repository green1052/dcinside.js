import type {Options as KyOptions} from "ky";
import {ArticleManager} from "./articles";
import {AuthManager} from "./auth";
import {CommentManager} from "./comments";
import {DCConManager} from "./dccon";
import {GalleryManager} from "./galleries";
import {KyHttpClient, type ProxyOptions} from "./http";
import {ManagementManager} from "./management";
import {SearchManager} from "./search";
import type {Session, User} from "./types";
import {UserManager} from "./user";

export interface DCInsideClientOptions {
    http?: KyOptions & ProxyOptions;
}

export class DCInsideClient {
    readonly http: KyHttpClient;
    readonly auth: AuthManager;
    readonly articles: ArticleManager;
    readonly comments: CommentManager;
    readonly dccons: DCConManager;
    readonly galleries: GalleryManager;
    readonly management: ManagementManager;
    readonly search: SearchManager;
    readonly user: UserManager;

    session: Session | null = null;

    constructor(options: DCInsideClientOptions = {}) {
        this.http = new KyHttpClient(options.http);
        this.auth = new AuthManager(this.http);
        this.http.useDCInsideContext({
            getAppId: () => this.auth.getAppId(),
            getClientToken: () => this.auth.fcmToken,
            getUserId: () => this.session?.detail?.userId ?? null
        });
        this.articles = new ArticleManager(this.http, this.auth, () => this.session);
        this.comments = new CommentManager(this.http, this.auth, () => this.session);
        this.dccons = new DCConManager(this.http, () => this.session);
        this.galleries = new GalleryManager(this.http);
        this.management = new ManagementManager(this.http, this.auth, () => this.session);
        this.search = new SearchManager(this.http);
        this.user = new UserManager(this.http, () => this.session);
    }

    get currentUser(): User | null {
        return this.session?.user ?? null;
    }

    async login(id: string, password: string): Promise<Session> {
        this.session = await this.auth.login({type: "login", id, password});
        return this.session;
    }

    useAnonymous(id: string, password: string): Session {
        this.session = this.auth.createAnonymousSession(id, password);
        return this.session;
    }

    useSession(session: Session): this {
        this.session = session;
        return this;
    }
}