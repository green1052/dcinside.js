import type {CaptchaAnswer} from "../auth";
import {HOST} from "../constants";
import type {Fields} from "../http";
import type {
    ApiResult,
    ArticleDeleteResult,
    ArticleImage,
    ArticleListResponse,
    ArticleModifyInfo,
    ArticleTransferResult,
    ArticleViewResponse,
    ArticleVoteResult,
    OgLink,
    PollFinishResult,
    RelatedGalleryArticles
} from "../types/responses";
import {indexed, javaUrlEncode, textToHtml} from "../util";
import {Api} from "./context";

/** 게시글 검색 대상입니다. */
export type ArticleSearchType = "subject_m" | "subject" | "memo" | "name" | "comment" | "date";

export interface ArticleListOptions {
    gallery: string;
    page?: number;
    search?: {
        keyword: string;
        /** 기본 `subject_m`(제목+내용)입니다. */
        type?: ArticleSearchType;
        /** 이전 응답 `gall_info[0].ser_pos`입니다. 다음 검색 구간을 볼 때 넘깁니다. */
        pos?: string;
    };
    /** 말머리 번호입니다. */
    headId?: number;
    /** `recommend`: 개념글, `notice`: 공지, `best`: 베스트 */
    filter?: "recommend" | "notice" | "best";
    /** 썸네일형 목록(`boardtype=I`)을 받습니다. */
    thumbnail?: boolean;
    /** 말머리 페이지네이션용 마지막 글 번호입니다. */
    lastHeadNum?: string;
    date?: string;
}

export interface ArticleReadOptions {
    /** 비밀글/권한글 비밀번호입니다. */
    password?: string;
    headId?: number;
}

/** 본문 블록입니다. 문자열은 일반 텍스트로 취급합니다. */
export type ArticleBlock =
    | string
    | { type: "text"; text: string }
    | { type: "html"; html: string }
    | { type: "image"; file: Blob }
    /** `dccons.insert()`의 `img_tag`와 디테일 번호입니다. */
    | { type: "dccon"; tag: string; detailIdx: number; packageIdx?: number };

export interface ArticleWriteOptions {
    gallery: string;
    subject: string;
    content: ArticleBlock[];
    /** 수정할 글 번호입니다. 있으면 수정 모드로 보냅니다. */
    articleNo?: number;
    headText?: { no: number; name: string };
    captcha?: CaptchaAnswer;
    adultCode?: string;
    /** `true`면 비밀글, 문자열이면 그 비밀번호로 잠근 비밀글입니다. */
    secret?: boolean | string;
    /** 자동 삭제 시간 코드입니다. */
    autoDeleteTime?: string;
    /** 매니저 고정글로 올립니다. */
    fix?: boolean;
    /** 갤러리 닉네임으로 씁니다. */
    useGalleryNickname?: boolean;
    /** `polls.create()`로 만든 투표 키입니다. */
    vote?: string;
    /** `uploads.movie()` 결과로 만든 동영상 데이터입니다. */
    movies?: string[];
    /** 수정 시 지울 첨부 이미지 번호입니다. */
    deleteFiles?: string[];
    /** 다른 갤러리 글을 퍼올 때(`pum`) 쓰는 정보입니다. */
    pum?: Fields;
    /** 글을 실제로 쓰지 않고 검증만 합니다(`mode=validate`). */
    validateOnly?: boolean;
}

export interface PollCreateOptions {
    gallery: string;
    title: string;
    items: string[];
    /** 항목 이미지입니다. `items`와 같은 순서입니다. */
    images?: (Blob | null)[];
    /** 복수 선택 허용 시 최대 선택 수입니다. */
    multiple?: number;
    /** 투표 전 결과 미리보기 허용 여부입니다. */
    preview?: boolean;
    /** 마감 시각 문자열입니다. 없으면 무기한입니다. */
    endDate?: string;
    /** 참여 권한 코드입니다. */
    permission?: string;
}

/**
 * 게시글 API입니다. 목록/읽기는 세션 없이, 쓰기/삭제/추천은 세션(익명 또는 로그인)이 필요합니다.
 */
export class ArticleApi extends Api {
    /** 게시글 목록과 갤러리 정보를 가져옵니다. (`gall_list_new.php`) */
    async list(options: ArticleListOptions): Promise<ArticleListResponse> {
        const {search} = options;
        return this.get("ArticleListResponse", `${HOST.app}/api/gall_list_new.php`, {
            id: options.gallery,
            page: options.page ?? 1,
            s_type: search ? search.type ?? "subject_m" : undefined,
            serVal: search?.keyword,
            ser_pos: search?.pos,
            confirm_id: this.userId,
            headid: options.headId,
            pageLastHeadnum: options.lastHeadNum,
            boardtype: options.thumbnail ? "I" : undefined,
            date: options.date,
            ...(options.filter ? {[options.filter]: "1"} : {})
        });
    }

    /** 빈 페이지나 같은 페이지가 나올 때까지 목록을 페이지 단위로 순회합니다. */
    async* pages(options: ArticleListOptions): AsyncGenerator<ArticleListResponse> {
        let previous: number | undefined;
        for (let page = options.page ?? 1; ; page++) {
            const result = await this.list({...options, page});
            const first = result.gall_list?.[0]?.no;
            // 마지막 페이지를 넘기면 서버가 같은 페이지를 다시 주기도 합니다.
            if (first === undefined || first === previous) return;
            previous = first;
            yield result;
        }
    }

    /** 게시글 본문과 정보를 읽습니다. (`gall_view_new.php`) */
    async read(gallery: string, no: number, options: ArticleReadOptions = {}): Promise<ArticleViewResponse> {
        return this.get("ArticleViewResponse", `${HOST.app}/api/gall_view_new.php`, {
            id: gallery,
            no,
            confirm_id: this.userId,
            permission_pw: options.password,
            headid: options.headId,
            client_id: await this.clientToken()
        });
    }

    /** 본문 이미지 원본 주소 목록입니다. (`view_img.php`) */
    async images(gallery: string, no: number): Promise<ArticleImage[]> {
        return this.getList("ArticleImage", `${HOST.app}/api/view_img.php`, {id: gallery, no, confirm_id: this.userId});
    }

    /** 글을 쓰거나(`articleNo` 없음) 수정합니다. (`_app_write_api.php`) */
    async write(options: ArticleWriteOptions): Promise<ApiResult> {
        const session = this.requireSession();
        const fields: Fields = {
            id: options.gallery,
            mode: options.validateOnly ? "validate" : options.articleNo ? "modify" : "write",
            no: options.validateOnly ? undefined : options.articleNo,
            client_token: await this.clientToken(),
            head_name: options.headText?.name,
            head_no: options.headText?.no,
            subject: javaUrlEncode(options.subject),
            ...(session.type === "anonymous"
                ? {adult_code: options.adultCode, name: javaUrlEncode(session.nickname), password: session.password}
                : {user_id: session.userId}),
            ...indexed("file_del_img", options.deleteFiles),
            code: options.captcha?.key,
            dcblock: options.captcha?.code,
            fix: options.fix ? "true" : "",
            secret_use: options.secret ? "1" : "0",
            secret_password: typeof options.secret === "string" ? options.secret : undefined,
            vote: options.vote,
            auto_del_time: options.autoDeleteTime,
            ...indexed("movie_data", options.movies),
            is_quick: "0",
            use_gall_nickname: options.useGalleryNickname ?? false,
            ...options.pum,
            not_allowed_pum: "0",
            write_movie: options.validateOnly || options.articleNo ? undefined : options.movies?.length ? "1" : "0"
        };

        let images = 0;
        options.content.forEach((raw, index) => {
            const block = typeof raw === "string" ? {type: "text" as const, text: raw} : raw;
            const key = `memo_block[${index}]`;
            if (block.type === "text") fields[key] = encodeMemo(`<div>${textToHtml(block.text)}</div>`);
            else if (block.type === "html") fields[key] = encodeMemo(block.html);
            else if (block.type === "image") {
                fields[key] = `Dc_App_Img_${images}`;
                fields[`upload[${images++}]`] = block.file;
            } else {
                fields[key] = encodeMemo(block.tag);
                fields[`detail_idx[${index}]`] = block.packageIdx ? `${block.packageIdx}|dccon|${block.detailIdx}` : block.detailIdx;
            }
        });

        return this.post("ApiResult", `${HOST.upload}/_app_write_api.php`, fields);
    }

    /** 수정 화면에 필요한 기존 제목/본문/첨부를 가져옵니다. (`gall_modify.php`) */
    async modifyInfo(gallery: string, no: number): Promise<ArticleModifyInfo> {
        return this.post("ArticleModifyInfo", `${HOST.app}/api/gall_modify.php`, {id: gallery, no, ...this.owner()});
    }

    /** 글을 삭제합니다. (`gall_del.php`) */
    async delete(gallery: string, no: number, options: { checkLimit?: boolean } = {}): Promise<ArticleDeleteResult> {
        const session = this.requireSession();
        return this.post("ArticleDeleteResult", `${HOST.app}/api/gall_del.php`, {
            ...(session.type === "anonymous" ? {write_pw: session.password} : {user_id: session.userId}),
            client_token: await this.clientToken(),
            id: gallery,
            no,
            mode: "board_del2",
            del_limit_chk: options.checkLimit ? "1" : undefined
        });
    }

    /** 추천합니다. 캡챠가 필요하면 `CaptchaRequiredError`가 납니다. (`_recommend_up.php`) */
    async upvote(gallery: string, no: number, captcha?: CaptchaAnswer): Promise<ArticleVoteResult> {
        return this.vote("_recommend_up.php", gallery, no, captcha);
    }

    /** 비추천합니다. (`_recommend_down.php`) */
    async downvote(gallery: string, no: number, captcha?: CaptchaAnswer): Promise<ArticleVoteResult> {
        return this.vote("_recommend_down.php", gallery, no, captcha);
    }

    /** 실베 추천(힛추)을 보냅니다. (`hit_recommend`) */
    async hitRecommend(gallery: string, no: number): Promise<ApiResult> {
        return this.post("ApiResult", `${HOST.app}/api/hit_recommend`, {id: gallery, no, confirm_id: this.userId});
    }

    /** 베스트 콘텐츠 추천을 보냅니다. (`bestcontent/recommend`) */
    async bestRecommend(gallery: string, no: number): Promise<ApiResult> {
        return this.post("ApiResult", `${HOST.app}/bestcontent/recommend`, {id: gallery, no, confirm_id: this.userId});
    }

    /** 연관 갤러리/디시콘 정보입니다. (`relation_list.php`) */
    async related(gallery: string): Promise<RelatedGalleryArticles> {
        return this.post("RelatedGalleryArticles", `${HOST.app}/api/relation_list.php`, {id: gallery, client_token: await this.clientToken()});
    }

    /** 링크 미리보기(OG 태그)를 가져옵니다. (`oglink`) */
    async linkPreview(url: string): Promise<OgLink> {
        return this.post("OgLink", `${HOST.app}/api/oglink`, {url});
    }

    /** 내 글 이전(갤러리 이동) 정보를 조회합니다. (`my_transfer`) */
    async transferInfo(no: number): Promise<ArticleTransferResult> {
        return this.post("ArticleTransferResult", `${HOST.app}/api/my_transfer`, {confirm_id: this.requireLogin().userId, no});
    }

    /** 내 글 이전을 취소합니다. (`cancel_transfer`) */
    async cancelTransfer(no: number): Promise<ApiResult> {
        return this.post("ApiResult", `${HOST.app}/api/cancel_transfer`, {confirm_id: this.requireLogin().userId, no});
    }

    /** 앱의 신고 웹페이지 주소입니다. */
    async reportUrl(gallery: string, no: number): Promise<string> {
        const url = new URL(`${HOST.mobile}/api/report.php`);
        url.searchParams.set("app_id", await this.ctx.auth.appId());
        url.searchParams.set("id", gallery);
        url.searchParams.set("no", String(no));
        if (this.userId) url.searchParams.set("confirm_id", this.userId);
        return url.toString();
    }

    /** 투표를 만듭니다. 응답의 투표 키를 `write({vote})`에 넘기세요. (`_app_vote_upload.php`) */
    async createPoll(options: PollCreateOptions): Promise<ApiResult> {
        const fields: Fields = {
            id: options.gallery,
            client_token: await this.clientToken(),
            user_id: this.userId,
            title: options.title,
            multi: options.multiple ? "1" : "0",
            multi_cnt: options.multiple ? String(options.multiple).padStart(2, "0") : undefined,
            preview: String(options.preview ? 1 : 0).padStart(2, "0"),
            end_date_set: options.endDate ? "1" : "0",
            end_date: options.endDate,
            permission: options.permission,
            ...indexed("voteItem", options.items)
        };
        options.images?.forEach((image, index) => (fields[`vote_img[${index}]`] = image));
        return this.post("ApiResult", `${HOST.upload}/_app_vote_upload.php`, fields);
    }

    /** 투표 마감일을 바꿉니다. (`votemodify`) */
    async modifyPoll(gallery: string, no: number, voteConfirm: string, endDate?: string): Promise<ApiResult> {
        return this.post("ApiResult", `${HOST.app}/api/votemodify`, {
            user_id: this.userId,
            id: gallery,
            no,
            vote_confirm: voteConfirm,
            end_date_set: endDate ? "1" : "0",
            end_date: endDate
        });
    }

    /** 투표를 종료합니다. (`m.dcinside.com/poll/finish`) */
    async finishPoll(conKey: string, poll: string, password?: string): Promise<PollFinishResult> {
        return this.post("PollFinishResult", `${HOST.mobile}/poll/finish`, {con_key: conKey, poll, pw: password}, {appId: false});
    }

    private vote(path: string, gallery: string, no: number, captcha?: CaptchaAnswer): Promise<ArticleVoteResult> {
        return this.post("ArticleVoteResult", `${HOST.app}/api/${path}`, {
            id: gallery,
            confirm_id: this.userId,
            no,
            rand_code: captcha?.key,
            captcha_code: captcha?.code
        });
    }

    /** 익명이면 비밀번호, 로그인이면 user_id를 담습니다. */
    private owner(): Fields {
        const session = this.requireSession();
        return session.type === "anonymous" ? {password: session.password} : {user_id: session.userId};
    }
}

/** 앱처럼 본문 블록을 URL 인코딩하되 줄바꿈은 그대로 둡니다. */
function encodeMemo(html: string): string {
    return javaUrlEncode(html).replace(/%0A/g, "\n");
}
