import {APP, HOST} from "../constants";
import {DCInsideError} from "../errors";
import {decodeHtml} from "../util";
import {Api} from "./context";

/** 갤로그 분류입니다. */
export type GallogCategory = "all" | "board" | "minor" | "mini" | "person";

/** 갤로그는 웹페이지라 앱 API UA(`dcinside.app`)만 보내면 403이 납니다. 앱 웹뷰와 같은 UA를 씁니다. */
const WEB_HEADERS = {"User-Agent": APP.webViewUserAgent};

const POST_MENU: Record<GallogCategory, string> = {all: "G_all", board: "G", minor: "E", mini: "N", person: "P"};
const COMMENT_MENU: Record<GallogCategory, string> = {all: "R_all", board: "R", minor: "D", mini: "I", person: "L"};

export interface GallogItem {
    /** 갤로그 내부 갤러리 코드입니다. `resolveGallery()`로 갤러리 ID를 얻습니다. */
    gallCode: string;
    /** 글 번호입니다. */
    no: number;
    /** 분류 문자(`G`/`E`/`N`/`P`, 댓글은 `R`/`D`/`I`/`L`)입니다. */
    gallType: string;
    /** 글 제목, 댓글이면 댓글 내용입니다. */
    text: string;
    galleryName: string;
    /** `2026.10.06 12:32` 같은 작성 시각입니다. */
    date: string;
    /** 글의 댓글 수입니다. */
    commentCount?: number;
    /** `(펌)` 같은 표시입니다. */
    badge?: string;
    /** 댓글이 달린 원글 제목입니다. */
    originalTitle?: string;
}

export interface GallogList {
    items: GallogItem[];
    /** 분류별 개수입니다. */
    counts: Partial<Record<GallogCategory, number>>;
    /** 공개 여부입니다. 비공개면 목록이 비어 있습니다. */
    public: boolean;
    page: number;
    nextPage: number | null;
}

export interface GuestbookEntry {
    nickname: string;
    /** 작성자 갤로그 ID입니다. 유동이면 없습니다. */
    userId?: string;
    text: string;
    date: string;
    secret: boolean;
}

export interface GallogHome {
    userId: string;
    nickname: string;
    todayVisitors?: number;
    totalVisitors?: number;
    profileImage: string;
    postCount?: number;
    commentCount?: number;
}

/**
 * 갤로그 보기입니다. 앱은 갤로그를 모바일 웹(`m.dcinside.com/gallog/{id}`) 웹뷰로 엽니다.
 * 같은 페이지를 읽어 목록으로 돌려줍니다. 로그인했으면 앱처럼 `confirm_id`를 붙여 내 비공개 글도 보입니다.
 */
export class GallogApi extends Api {
    /** 앱이 여는 갤로그 주소(`app_id`, `confirm_id` 포함)입니다. */
    async url(userId: string): Promise<string> {
        const url = new URL(`${HOST.mobile}/gallog/${encodeURIComponent(userId)}`);
        url.searchParams.set("app_id", await this.ctx.auth.appId());
        if (this.userId) url.searchParams.set("confirm_id", this.userId);
        return url.toString();
    }

    /** 닉네임, 방문자 수, 글/댓글 수입니다. */
    async home(userId: string): Promise<GallogHome> {
        const html = await this.page(userId, {});
        const visit = /today-visit[\s\S]*?class="ct">([\d,]+)<\/span>\s*\/\s*([\d,]+)/.exec(html);
        return {
            userId,
            nickname: decodeHtml(/<span class="tit">([\s\S]*?)의 갤로그<\/span>/.exec(html)?.[1]?.trim() ?? ""),
            todayVisitors: toNumber(visit?.[1]),
            totalVisitors: toNumber(visit?.[2]),
            profileImage: `https://dcimg2.dcinside.co.kr/gallog_upimg.php?mode=profile&gid=${encodeURIComponent(userId)}`,
            postCount: toNumber(/menu=G_all">게시물<span class="ct2">\(([\d,]+)\)/.exec(html)?.[1]),
            commentCount: toNumber(/menu=R_all">댓글<span class="ct2">\(([\d,]+)\)/.exec(html)?.[1])
        };
    }

    /** 작성한 글 목록입니다. */
    async posts(userId: string, options: { category?: GallogCategory; page?: number } = {}): Promise<GallogList> {
        return this.list(userId, POST_MENU[options.category ?? "all"], options.page ?? 1);
    }

    /** 작성한 댓글 목록입니다. 각 항목의 `originalTitle`이 원글 제목입니다. */
    async comments(userId: string, options: { category?: GallogCategory; page?: number } = {}): Promise<GallogList> {
        return this.list(userId, COMMENT_MENU[options.category ?? "all"], options.page ?? 1);
    }

    /** 갤로그 스크랩 목록입니다. */
    async scraps(userId: string, page = 1): Promise<GallogList> {
        return this.list(userId, "B", page);
    }

    /** 방명록입니다. 비밀 방명록은 내용이 가려져 옵니다. */
    async guestbook(userId: string, page = 1): Promise<GuestbookEntry[]> {
        const html = await this.page(userId, {menu: "U", page});
        return [...html.matchAll(/<li class="comment"([^>]*)>([\s\S]*?)<\/li>/g)].map(([, attrs, body]) => {
            const nick = /<a href="[^"]*\/gallog\/([^"\s]+)\s*"[^>]*class="nick">([\s\S]*?)<\/a>/.exec(body!)
                ?? /class="nick"[^>]*>([\s\S]*?)<\/(?:a|span)>/.exec(body!);
            const [userIdMatch, nickname] = nick && nick.length === 3 ? [nick[1], nick[2]] : [undefined, nick?.[1]];
            return {
                nickname: clean(nickname ?? ""),
                ...(userIdMatch ? {userId: userIdMatch} : {}),
                text: clean(/<p class="txt">([\s\S]*?)<\/p>/.exec(body!)?.[1] ?? ""),
                date: clean(/<span class="date">([\s\S]*?)<\/span>/.exec(body!)?.[1] ?? ""),
                secret: /secret="1"/.test(attrs!)
            };
        });
    }

    /**
     * 갤로그 항목의 `gallCode`를 앱 API에서 쓰는 갤러리 ID(`mi$`/`pr$` 포함)로 바꿉니다.
     * 갤로그 페이지가 글을 열 때 쓰는 `/gallog/list-direct`를 호출합니다.
     */
    async resolveGallery(item: Pick<GallogItem, "gallCode" | "gallType">): Promise<string> {
        const result = await this.http.post<{ gall_id?: string }>(`${HOST.mobile}/gallog/list-direct`,
            {gall_code: item.gallCode, gall_type: item.gallType}, {appId: false, urlencoded: true, raw: true, headers: WEB_HEADERS});
        if (!result.gall_id) throw new DCInsideError(`갤러리를 찾을 수 없습니다: ${item.gallCode}`);
        if ("NISX".includes(item.gallType)) return `mi$${result.gall_id}`;
        if ("PLQ".includes(item.gallType)) return `pr$${result.gall_id}`;
        return result.gall_id;
    }

    private async list(userId: string, menu: string, page: number): Promise<GallogList> {
        const html = await this.page(userId, {menu, page});
        const counts: GallogList["counts"] = {};
        const keys: GallogCategory[] = ["all", "board", "minor", "mini", "person"];
        for (const match of html.matchAll(/<span class="tab-txt">[^<]*<\/span><span class="ct"(?: id="total_cnt(\d)")?>([\d,]+)/g)) {
            const index = match[1] ? Number(match[1]) - 1 : 4;
            counts[keys[index]!] = toNumber(match[2]);
        }
        const items = [...html.matchAll(/<li class="[^"]*" gall_code="(\d+)" gall_no="(\d+)" gall_type="(\w+)">([\s\S]*?)<!-- \/\/\.gallog-lnktb -->/g)]
            .map(([, gallCode, no, gallType, body]) => parseItem(gallCode!, no!, gallType!, body!));
        const next = new RegExp(`menu=${menu}&amp;page=(\\d+)" class="next"`).exec(html)?.[1]
            ?? (html.includes(`menu=${menu}&amp;page=${page + 1}"`) ? String(page + 1) : null);
        return {items, counts, public: !/class="btn-mline ntc-line-ingray">비공개/.test(html), page, nextPage: next ? Number(next) : null};
    }

    private async page(userId: string, query: Record<string, string | number>): Promise<string> {
        const html = await this.http.get<unknown>(`${HOST.mobile}/gallog/${encodeURIComponent(userId)}`, {
            ...query,
            confirm_id: this.userId
        }, {raw: true, appId: Boolean(this.userId), headers: WEB_HEADERS});
        if (typeof html !== "string") throw new DCInsideError("갤로그 페이지를 읽지 못했습니다.");
        return html;
    }
}

function parseItem(gallCode: string, no: string, gallType: string, body: string): GallogItem {
    const text = /<span class="txt">([\s\S]*?)<\/span>/.exec(body)?.[1] ?? /<span class="fxo-txt">([\s\S]*?)<\/span>/.exec(body)?.[1] ?? "";
    const info = [...(/<ul class="ginfo">([\s\S]*?)<\/ul>/.exec(body)?.[1] ?? "").matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => clean(m[1]!));
    const fullDate = /<span class="date">([^<]*)<\/span>/.exec(body)?.[1];
    const comments = /<span class="num">\[(\d+)\]<\/span>/.exec(body)?.[1];
    const badge = /<span class="badge">([\s\S]*?)<\/span>/.exec(body)?.[1];
    const original = /<span class="original-tit">([\s\S]*?)<\/span>/.exec(body)?.[1];
    return {
        gallCode,
        no: Number(no),
        gallType,
        text: clean(text),
        galleryName: info[0] ?? "",
        date: clean(fullDate ?? info[1] ?? ""),
        ...(comments ? {commentCount: Number(comments)} : {}),
        ...(badge ? {badge: clean(badge)} : {}),
        ...(original ? {originalTitle: clean(original)} : {})
    };
}

/** 태그를 지우고 엔티티를 풀고 공백을 정리합니다. */
function clean(html: string): string {
    return decodeHtml(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/[ \t\r]*\n[ \t\r]*/g, "\n").trim();
}

function toNumber(value: string | undefined): number | undefined {
    return value ? Number(value.replace(/,/g, "")) : undefined;
}
