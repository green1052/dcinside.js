import type {Options as KyOptions} from "ky";
import {AuthManager} from "../core/auth";
import {AuthExpiredError, KyHttpClient, type ProxyOptions} from "../core/http";
import type {DeviceCredentials, LoginInput, Session, User} from "../core/types";
import {ArticleManager} from "../modules/articles";
import {CommentManager} from "../modules/comments";
import {DCConManager} from "../modules/dccon";
import {GalleryManager} from "../modules/galleries";
import {ManagementManager} from "../modules/management";
import {NotificationManager} from "../modules/notifications";
import {SearchManager} from "../modules/search";
import {UserManager} from "../modules/user";
import {GalleryClient} from "./gallery";

export interface DCInsideClientOptions {
    /** ky에 전달할 HTTP 옵션입니다. Bun 런타임에서는 `proxy`도 함께 사용할 수 있습니다. */
    http?: KyOptions & ProxyOptions;
    /** 외부에서 저장한 디바이스 인증 정보를 복원합니다. 모든 발급 절차를 생략합니다. */
    credentials?: DeviceCredentials;
}

/**
 * 디시인사이드 모바일 앱 API 클라이언트입니다.
 *
 * 생성 직후에는 네트워크 요청을 하지 않습니다. 첫 API 호출 시 인증에 필요한
 * `client_token`과 `app_id`를 자동으로 발급하고, 이후 캐시된 값을 재사용합니다.
 */
export class DCInsideClient {
    readonly http: KyHttpClient;
    readonly auth: AuthManager;
    readonly dccons: DCConManager;
    readonly galleries: GalleryManager;
    readonly management: ManagementManager;
    readonly notifications: NotificationManager;
    readonly search: SearchManager;
    readonly user: UserManager;

    /**
     * 새 클라이언트를 생성합니다.
     *
     * @param options HTTP 옵션와 프록시 설정입니다.
     */
    constructor(options: DCInsideClientOptions = {}) {
        this.http = new KyHttpClient(options.http);
        this.auth = new AuthManager(this.http);
        if (options.credentials) this.auth.importCredentials(options.credentials);
        this.http.useDCInsideContext({
            getAppId: () => this.auth.getAppId(),
            getClientToken: () => this.auth.fcmToken,
            ensureClientToken: () => this.auth.fetchClientToken(),
            getUserId: () => this._session?.detail?.userId ?? null,
            refreshAppId: () => this.auth.refreshAppId({refreshClientToken: true}),
            refreshLogin: async () => {
                const session = this._session;
                if (!session || session.user.type !== "login") {
                    throw new AuthExpiredError("loginSession", "no active login session to refresh");
                }
                this._session = await this.auth.login({
                    id: session.user.id,
                    password: session.user.password
                });
            }
        });
        this.articleManager = new ArticleManager(this.http, this.auth, () => this._session);
        this.commentManager = new CommentManager(this.http, this.auth, () => this._session);
        this.dccons = new DCConManager(this.http, () => this._session);
        this.galleries = new GalleryManager(this.http);
        this.management = new ManagementManager(this.http, this.auth, () => this._session);
        this.notifications = new NotificationManager(this.http, this.auth);
        this.search = new SearchManager(this.http);
        this.user = new UserManager(this.http, () => this._session);
    }
    private readonly articleManager: ArticleManager;
    private readonly commentManager: CommentManager;

    private _session: Session | null = null;

    /** 현재 설정된 세션입니다. 세션이 없으면 `null`입니다. */
    get session(): Session | null {
        return this._session;
    }

    /** 현재 설정된 세션의 사용자 정보입니다. 세션이 없으면 `null`입니다. */
    get currentUser(): User | null {
        return this._session?.user ?? null;
    }

    /**
     * DCInside 계정으로 로그인하고 세션을 저장합니다.
     *
     * @param id DCInside 아이디입니다.
     * @param password DCInside 비밀번호입니다.
     * @param options OTP, 캡챠, 로그인 모드 등 추가 옵션입니다.
     * @returns 로그인 상세 정보가 포함된 세션입니다.
     */
    async login(id: string, password: string, options: Omit<LoginInput, "id" | "password"> = {}): Promise<Session> {
        this._session = await this.auth.login({id, password, ...options});
        return this._session;
    }

    /**
     * 익명 작성용 세션을 저장합니다.
     *
     * @param id 익명 닉네임입니다.
     * @param password 글/댓글 삭제에 사용할 비밀번호입니다.
     * @returns 체이닝을 위한 현재 클라이언트입니다.
     */
    useAnonymous(id: string, password: string): this {
        this._session = this.auth.createAnonymousSession(id, password);
        return this;
    }

    /**
     * 외부에서 보관한 세션을 현재 클라이언트에 주입합니다.
     *
     * @param session `login` 또는 `useAnonymous`가 반환한 세션 객체입니다.
     * @returns 체이닝을 위한 현재 클라이언트입니다.
     */
    useSession(session: Session): this {
        this._session = session;
        return this;
    }

    /**
     * 현재 세션을 초기화합니다.
     *
     * @returns 체이닝을 위한 현재 클라이언트입니다.
     */
    logout(): this {
        this._session = null;
        return this;
    }

    /**
     * 갤러리 컨텍스트를 고정한 하위 클라이언트를 반환합니다.
     *
     * `client.gallery("mi$bjwg64").articles.list()` 또는
     * `client.gallery("mi$bjwg64").article(123).comments.write(...)`처럼
     * 호출하면 이후 갤러리/게시글 식별자를 반복해서 넘기지 않아도 됩니다.
     */
    gallery(galleryId: string): GalleryClient {
        return new GalleryClient(galleryId, this.articleManager, this.commentManager);
    }
}