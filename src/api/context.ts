import type {Auth, LoginSession, Session} from "../auth";
import {SessionRequiredError} from "../errors";
import type {Fields, Http, RequestOptions, ResponseName} from "../http";
import type {ResponseMap} from "../types/responses";

type Options = Omit<RequestOptions, "as" | "list">;

/** API 모듈이 공유하는 의존성입니다. */
export interface ApiContext {
    http: Http;
    auth: Auth;
    session(): Session | null;
}

/** 모든 API 모듈의 바탕입니다. 세션/토큰 헬퍼를 제공합니다. */
export abstract class Api {
    constructor(protected readonly ctx: ApiContext) {
    }

    protected get http(): Http {
        return this.ctx.http;
    }

    /** GET을 보내고 응답을 `as` 모델로 정규화합니다. */
    protected get<K extends ResponseName>(as: K, url: string, query: Fields = {}, options: Options = {}): Promise<ResponseMap[K]> {
        return this.http.get(url, query, {...options, as});
    }

    /** GET을 보내고 배열 응답의 각 항목을 `as` 모델로 정규화합니다. */
    protected getList<K extends ResponseName>(as: K, url: string, query: Fields = {}, options: Options = {}): Promise<ResponseMap[K][]> {
        return this.http.get(url, query, {...options, as, list: true});
    }

    /** multipart POST를 보내고 응답을 `as` 모델로 정규화합니다. */
    protected post<K extends ResponseName>(as: K, url: string, fields: Fields = {}, options: Options = {}): Promise<ResponseMap[K]> {
        return this.http.post(url, fields, {...options, as});
    }

    protected postList<K extends ResponseName>(as: K, url: string, fields: Fields = {}, options: Options = {}): Promise<ResponseMap[K][]> {
        return this.http.post(url, fields, {...options, as, list: true});
    }

    /** 로그인했으면 `user_id`, 아니면 `undefined`입니다. 앱의 `confirm_id`/`user_id` 필드에 씁니다. */
    protected get userId(): string | undefined {
        const session = this.ctx.session();
        return session?.type === "login" ? session.userId : undefined;
    }

    /** FCM `client_token`입니다. 앱에서는 `client_id`라는 이름으로도 보냅니다. */
    protected clientToken(): Promise<string> {
        return this.ctx.auth.ensureClientToken();
    }

    protected requireSession(): Session {
        const session = this.ctx.session();
        if (!session) throw new SessionRequiredError("세션이 필요합니다. login() 또는 useAnonymous()를 먼저 호출하세요.");
        return session;
    }

    protected requireLogin(): LoginSession {
        const session = this.ctx.session();
        if (session?.type !== "login") throw new SessionRequiredError("로그인이 필요합니다. login()을 먼저 호출하세요.");
        return session;
    }
}
