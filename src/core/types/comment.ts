import type {CaptchaAnswer} from "./captcha";
import type {DCCon} from "./dccon";
import type {GalleryTarget} from "./gallery";

/** 댓글 작성 본문 입력입니다. 응답용이 아닌 write()/reply() 입력 DTO입니다. */
export type CommentContent =
    | {
    type: "text";
    memo: string;
}
    | {
    type: "dccon";
    dccon: DCCon;
};

export type CommentReadOptions = GalleryTarget & {
    articleId: number;
    page?: number;
};

/** 댓글 mention 원본입니다. */
export interface CommentMention {
    name: string;
    target_no: number;
    number: string;
    ip: string;
    is_user: boolean;
}

/** 댓글 항목 원본(`comment_list` 요소)입니다. */
export interface CommentData {
    member_icon: number;
    ipData: string | null;
    name: string;
    user_id: string;
    date_time: string;
    reg_date?: string;
    under_step: boolean;
    mention: CommentMention | Record<string, never>;
    comment_no: number;
    is_delete_flag: string | null;
    del_scope: number | null;
    dccon: string | null;
    dccon_detail_idx: number;
    dccon_type: string | null;
    comment_memo: string;
}

/** 댓글 목록 응답 원본입니다. */
export interface CommentReadResult {
    total_comment: number;
    total_page: number;
    re_page: number;
    comment_list: CommentData[];
}

export type CommentWriteOptions = GalleryTarget & {
    articleId: number;
    content: CommentContent | string;
    /** 캡챠(보안코드) 답변입니다. 서버가 캡챠를 요구할 때 전달합니다. */
    captcha?: CaptchaAnswer;
    /** 성인 인증 코드입니다. 성인 갤러리 댓글 작성 시 필요할 수 있습니다. */
    adultCode?: string;
};

export type CommentReplyOptions = CommentWriteOptions & {
    replyToCommentId: number;
};

export type CommentDeleteOptions = GalleryTarget & {
    articleId: number;
    commentId: number;
};

/** 댓글 삭제 응답 원본입니다. */
export interface CommentDeleteResult {
    result: boolean;
    cause: string | null;
}

/** 댓글 작성 응답 원본입니다. */
export interface CommentWriteResult {
    result: boolean;
    data: number | null;
    cause: string | null;
    word: string | null;
}