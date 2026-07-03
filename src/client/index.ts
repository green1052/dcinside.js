import type {Options as KyOptions} from "ky";
import {AuthManager} from "../core/auth";
import {KyHttpClient, type ProxyOptions} from "../core/http";
import type {DeviceCredentials, Session, User} from "../core/types";
import {ArticleManager} from "../modules/articles";
import {CommentManager} from "../modules/comments";
import {DCConManager} from "../modules/dccon";
import {GalleryManager} from "../modules/galleries";
import {ManagementManager} from "../modules/management";
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
    readonly search: SearchManager;
    readonly user: UserManager;
    session: Session | null = null;
    private readonly articleManager: ArticleManager;
    private readonly commentManager: CommentManager;

    /**
     * 새 클라이언트를 생성합니다.
     *
     * @param options HTTP 옵션과 프록시 설정입니다.
     */
    constructor(options: DCInsideClientOptions = {}) {
        this.http = new KyHttpClient(options.http);
        this.auth = new AuthManager(this.http);
        if (options.credentials) this.auth.importCredentials(options.credentials);
        this.http.useDCInsideContext({
            getAppId: () => this.auth.getAppId(),
            getClientToken: () => this.auth.fcmToken,
            ensureClientToken: () => this.auth.fetchClientToken(),
            getUserId: () => this.session?.detail?.userId ?? null
        });
        this.articleManager = new ArticleManager(this.http, this.auth, () => this.session);
        this.commentManager = new CommentManager(this.http, this.auth, () => this.session);
        this.dccons = new DCConManager(this.http, () => this.session);
        this.galleries = new GalleryManager(this.http);
        this.management = new ManagementManager(this.http, this.auth, () => this.session);
        this.search = new SearchManager(this.http);
        this.user = new UserManager(this.http, () => this.session);
    }

    /** 현재 설정된 세션의 사용자 정보입니다. 세션이 없으면 `null`입니다. */
    get currentUser(): User | null {
        return this.session?.user ?? null;
    }

    /**
     * DCInside 계정으로 로그인하고 세션을 저장합니다.
     *
     * @param id DCInside 아이디입니다.
     * @param password DCInside 비밀번호입니다.
     * @returns 로그인 상세 정보가 포함된 세션입니다.
     */
    async login(id: string, password: string): Promise<Session> {
        this.session = await this.auth.login({type: "login", id, password});
        return this.session;
    }

    /**
     * 익명 작성용 세션을 저장합니다.
     *
     * @param id 익명 닉네임입니다.
     * @param password 글/댓글 삭제에 사용할 비밀번호입니다.
     * @returns 생성된 익명 세션입니다.
     */
    useAnonymous(id: string, password: string): Session {
        this.session = this.auth.createAnonymousSession(id, password);
        return this.session;
    }

    /**
     * 외부에서 보관한 세션을 현재 클라이언트에 주입합니다.
     *
     * @param session `login` 또는 `useAnonymous`가 반환한 세션 객체입니다.
     * @returns 체이닝을 위한 현재 클라이언트입니다.
     */
    useSession(session: Session): this {
        this.session = session;
        return this;
    }

    /**
     * 갤러리 컨텍스트를 고정한 하위 클라이언트를 반환합니다.
     *
     * `client.gallery("mi$bjwg64").articles.list()` 또는
     * `client.gallery("mi$bjwg64").article(123).comments.write(...)`처럼
     * 호출하면 이후 갤러리/게시글 식별자를 반복해서 넘기지 않아도 됩니다.
     */
    gallery(gallery: string): GalleryClient {
        return new GalleryClient(gallery, this.articleManager, this.commentManager);
    }
}