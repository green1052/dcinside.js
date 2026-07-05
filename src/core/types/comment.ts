import type {CaptchaAnswer} from "./captcha";
import type {DCCon} from "./dccon";
import type {GalleryTarget} from "./gallery";

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

export interface CommentData {
    memberIcon: number;
    ip: string | null;
    name: string;
    userId: string;
    content: CommentContent;
    id: number;
    dateTime: string;
    isReply: boolean;
    mention: CommentMention | null;
    deleteFlag: string | null;
    deleteScope: number | null;
}

export type CommentMention = {
    name: string;
    targetId: number;
    number: string;
    ip: string;
    isUser: boolean;
};

export interface CommentReadResult {
    totalComments: number;
    totalPages: number;
    page: number;
    comments: CommentData[];
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

export interface CommentDeleteResult {
    result: boolean;
    cause: string | null;
}

export interface CommentWriteResult {
    result: boolean;
    data: number | null;
    cause: string | null;
    word: string | null;
}