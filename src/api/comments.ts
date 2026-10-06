import type {CaptchaAnswer} from "../auth";
import {HOST} from "../constants";
import type {Fields} from "../http";
import type {ApiResult, CommentListResponse, CommentListResponseComment, CommentSearchResponse, PostInfo} from "../types/responses";
import {javaUrlEncode} from "../util";
import {Api} from "./context";

export interface CommentListOptions {
    page?: number;
    /** 정렬입니다. 생략하면 앱 기본(`style=new`)으로 받습니다. */
    sort?: "new" | "reply";
    /** 비밀글/권한글 비밀번호입니다. */
    password?: string;
    /** 특정 댓글 위치의 페이지를 받습니다. */
    commentNo?: number;
}

/** 댓글 본문입니다. 디시콘은 `dccons.insert()`의 태그와 디테일 번호를 넘깁니다(최대 2개). */
export type CommentContent = string | { dccons: { tag: string; detailIdx: number }[] };

/** 답글/멘션 대상 댓글입니다. `comments.list()` 결과의 항목을 그대로 넘겨도 됩니다. */
export type ParentComment = Pick<CommentListResponseComment, "comment_no" | "user_id">;

export interface CommentWriteOptions {
    /** 있으면 답글, `mention: true`면 멘션 댓글입니다. */
    parent?: ParentComment;
    mention?: boolean;
    /** `articles.read()`의 `view_info`입니다. 베스트 댓글 관련 필드를 앱처럼 채웁니다. */
    article?: Pick<PostInfo, "best_chk" | "best_comid" | "best_comno">;
    captcha?: CaptchaAnswer;
    adultCode?: string;
    useGalleryNickname?: boolean;
    /** 큰 디시콘으로 답니다. */
    bigDccon?: boolean;
    /** 텍스트콘 배경/글자 색입니다. */
    textcon?: { background: string; color: string };
}

/**
 * 댓글 API입니다. 쓰기/삭제는 세션(익명 또는 로그인)이 필요합니다.
 */
export class CommentApi extends Api {
    /** 댓글 목록입니다. (`comment_new.php`) */
    list(gallery: string, no: number, options: CommentListOptions = {}): Promise<CommentListResponse> {
        return this.http.get(`${HOST.app}/api/comment_new.php`, {
            style: options.sort ? undefined : "new",
            csort: options.sort,
            id: gallery,
            no,
            re_page: options.page ?? 1,
            user_id: this.userId,
            permission_pw: options.password,
            comment_no: options.commentNo
        });
    }

    /** 마지막 페이지(`total_page`)까지 댓글을 페이지 단위로 순회합니다. */
    async* pages(gallery: string, no: number, options: CommentListOptions = {}): AsyncGenerator<CommentListResponse> {
        for (let page = options.page ?? 1; ; page++) {
            const result = await this.list(gallery, no, {...options, page});
            if (!result.comment_list?.length) return;
            yield result;
            if (page >= (result.total_page ?? 0)) return;
        }
    }

    /** 이미지에 달린 댓글 목록입니다. (`img_comment_list`) */
    imageComments(gallery: string, no: number, fileNo: string, options: CommentListOptions = {}): Promise<CommentListResponse> {
        return this.http.get(`${HOST.app}/api/img_comment_list`, {
            id: gallery,
            no,
            re_page: options.page,
            user_id: this.userId,
            permission_pw: options.password,
            comment_no: options.commentNo,
            fileno: fileNo,
            csort: options.sort
        });
    }

    /** 글 안에서 댓글을 검색합니다. `mine: true`면 내 댓글만 찾습니다. (`search_comment`) */
    search(gallery: string, no: number, keyword?: string, options: { mine?: boolean } = {}): Promise<CommentSearchResponse> {
        return this.http.get(`${HOST.app}/api/search_comment`, {
            id: gallery,
            no,
            serval: keyword,
            confirm_id: options.mine ? this.requireLogin().userId : undefined
        });
    }

    /** 댓글을 답니다. `parent`가 있으면 답글입니다. (`comment_ok.php`) */
    async write(gallery: string, no: number, content: CommentContent, options: CommentWriteOptions = {}): Promise<ApiResult> {
        const session = this.requireSession();
        const fields: Fields = {
            ...this.target(gallery, no, options),
            ...(session.type === "anonymous"
                ? {adult_code: options.adultCode, comment_nick: session.nickname, comment_pw: session.password}
                : {user_id: session.userId}),
            client_token: await this.clientToken(),
            use_gall_nickname: options.useGalleryNickname ?? false,
            rand_code: options.captcha?.key,
            captcha_code: options.captcha?.code,
            use_bigdccon: options.bigDccon ?? false,
            txtcon_bcolor: options.textcon?.background,
            txtcon_fcolor: options.textcon?.color
        };
        if (typeof content === "string") fields["comment_memo"] = content;
        else if (content.dccons.length === 1) {
            fields["comment_memo"] = content.dccons[0]!.tag;
            fields["detail_idx"] = content.dccons[0]!.detailIdx;
        } else {
            fields["comment_memo"] = content.dccons.map((dccon) => dccon.tag).join("");
            content.dccons.forEach((dccon, index) => (fields[`detail_idx[${index}]`] = dccon.detailIdx));
        }
        return this.http.post(`${HOST.app}/api/comment_ok.php`, fields);
    }

    /** 답글을 답니다. `write(…, {parent})`와 같습니다. */
    reply(gallery: string, no: number, parent: ParentComment, content: CommentContent, options: Omit<CommentWriteOptions, "parent"> = {}): Promise<ApiResult> {
        return this.write(gallery, no, content, {...options, parent});
    }

    /** 보이스 댓글(음성 파일 + 텍스트)을 답니다. (`upload.dcinside.com/_app_upload.php`) */
    async writeVoice(gallery: string, no: number, file: File, options: CommentWriteOptions & { text?: string; downloadable?: boolean } = {}): Promise<ApiResult> {
        const session = this.requireSession();
        const {id: _, no: __, ...target} = this.target(gallery, no, options);
        return this.http.post(`${HOST.upload}/_app_upload.php`, {
            ...target,
            gall_id: gallery,
            gall_no: no,
            file_name: file.name,
            upfile: file,
            user_no: session.type === "login" ? session.result.user_no : undefined,
            ...(session.type === "anonymous"
                ? {adult_code: options.adultCode, comment_nick: javaUrlEncode(session.nickname), password: session.password}
                : {user_id: session.userId}),
            client_token: await this.clientToken(),
            comment_txt: options.text ? javaUrlEncode(options.text) : undefined,
            rand_code: options.captcha?.key,
            captcha_code: options.captcha?.code,
            use_gall_nickname: options.useGalleryNickname ?? false,
            down_chk: options.downloadable ?? false
        });
    }

    /** 댓글을 지웁니다. (`comment_del.php`) */
    async delete(gallery: string, no: number, commentNo: number, article?: CommentWriteOptions["article"]): Promise<ApiResult> {
        const session = this.requireSession();
        return this.http.post(`${HOST.app}/api/comment_del.php`, {
            ...(session.type === "anonymous" ? {comment_pw: session.password} : {user_id: session.userId}),
            client_token: await this.clientToken(),
            id: gallery,
            no,
            board_id: "",
            mode: "comment_del",
            best_chk: article?.best_chk ?? "N",
            best_comid: article?.best_comid,
            best_comno: article?.best_comno ?? 0,
            comment_no: commentNo
        });
    }

    /** 댓글/답글 공통 대상 필드입니다. 답글은 부모 댓글의 작성자 ID를 `reple_id`로 보냅니다. */
    private target(gallery: string, no: number, options: CommentWriteOptions): Fields {
        const mode = options.parent ? options.mention ? "com_mention" : "com_reple" : "com_write";
        return {
            id: gallery,
            no,
            board_id: "",
            best_chk: options.article?.best_chk ?? "N",
            best_comid: options.article?.best_comid,
            best_comno: options.article?.best_comno ?? 0,
            mode,
            reple_id: options.parent ? options.parent.user_id ?? "" : undefined,
            comment_no: options.parent?.comment_no
        };
    }
}
