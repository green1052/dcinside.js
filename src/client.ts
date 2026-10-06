import {AiImageApi} from "./api/ai";
import {AppApi} from "./api/app";
import {ArticleApi} from "./api/articles";
import {AutoImageApi} from "./api/auto-images";
import {CommentApi} from "./api/comments";
import type {ApiContext} from "./api/context";
import {DCConApi} from "./api/dccons";
import {GalleryApi} from "./api/galleries";
import {GallogApi} from "./api/gallog";
import {ManagementApi} from "./api/management";
import {NotificationApi} from "./api/notifications";
import {SearchApi} from "./api/search";
import {UploadApi} from "./api/uploads";
import {UserApi} from "./api/user";
import {Auth, type DeviceCredentials, type LoginOptions, type LoginSession, type Session} from "./auth";
import {Http, type HttpOptions} from "./http";

export interface DCInsideOptions {
    http?: HttpOptions;
    /** `auth.exportCredentials()`로 저장해 둔 디바이스 인증 정보입니다. 발급 과정을 건너뜁니다. */
    credentials?: DeviceCredentials;
    /** 저장해 둔 세션입니다. */
    session?: Session;
}

/**
 * 디시인사이드 앱 API 클라이언트입니다.
 *
 * 만들 때는 네트워크 요청을 하지 않습니다. 첫 요청에서 `client_token`과 `app_id`를 발급하고
 * 이후 재사용합니다. `app_id`나 로그인 세션이 만료되면 자동으로 갱신해 한 번 다시 보냅니다.
 */
export class DCInside {
    readonly http: Http;
    readonly auth: Auth;
    readonly articles: ArticleApi;
    readonly comments: CommentApi;
    readonly galleries: GalleryApi;
    readonly gallog: GallogApi;
    readonly search: SearchApi;
    readonly notifications: NotificationApi;
    readonly user: UserApi;
    readonly management: ManagementApi;
    readonly dccons: DCConApi;
    readonly uploads: UploadApi;
    readonly autoImages: AutoImageApi;
    readonly ai: AiImageApi;
    readonly app: AppApi;

    session: Session | null;
    private pendingRelogin: Promise<boolean> | null = null;

    constructor(options: DCInsideOptions = {}) {
        this.http = new Http(options.http);
        this.auth = new Auth(this.http);
        if (options.credentials) this.auth.importCredentials(options.credentials);
        this.session = options.session ?? null;

        this.http.context = {
            appId: () => this.auth.appId(),
            refreshAppId: () => this.auth.refreshAppId(),
            // 동시에 만료된 요청들이 로그인을 한 번만 하도록 합칩니다.
            relogin: () => (this.pendingRelogin ??= this.relogin().finally(() => (this.pendingRelogin = null)))
        };

        const ctx: ApiContext = {http: this.http, auth: this.auth, session: () => this.session};
        this.articles = new ArticleApi(ctx);
        this.comments = new CommentApi(ctx);
        this.galleries = new GalleryApi(ctx);
        this.gallog = new GallogApi(ctx);
        this.search = new SearchApi(ctx);
        this.notifications = new NotificationApi(ctx);
        this.user = new UserApi(ctx);
        this.management = new ManagementApi(ctx);
        this.dccons = new DCConApi(ctx);
        this.uploads = new UploadApi(ctx);
        this.autoImages = new AutoImageApi(ctx);
        this.ai = new AiImageApi(ctx);
        this.app = new AppApi(ctx);
    }

    /** 저장된 아이디/비밀번호로 앱처럼 `login_quick` 재로그인합니다. 실패하면 `login_normal`로 한 번 더 시도합니다. */
    private async relogin(): Promise<boolean> {
        const session = this.session;
        if (session?.type !== "login") return false;
        this.session = await this.auth.login(session.id, session.password, {mode: "login_quick"})
            .catch(() => this.auth.login(session.id, session.password));
        return true;
    }

    /** 로그인하고 세션으로 씁니다. */
    async login(id: string, password: string, options?: LoginOptions): Promise<LoginSession> {
        const session = await this.auth.login(id, password, options);
        this.session = session;
        return session;
    }

    /** 익명(유동) 닉네임/비밀번호를 세션으로 씁니다. 네트워크 요청은 없습니다. */
    useAnonymous(nickname: string, password: string): this {
        this.session = {type: "anonymous", nickname, password};
        return this;
    }

    logout(): this {
        this.session = null;
        return this;
    }
}
