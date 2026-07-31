import type {CaptchaAnswer} from "./captcha";
import type {GalleryTarget, HeadText} from "./gallery";

export type ArticleListOptions = GalleryTarget & {
    /** 1부터 시작하는 페이지 번호. 생략하면 `1`입니다. */
    page?: number;
    /** 검색어. 생략하면 일반 목록을 조회합니다. */
    searchKeyword?: string;
    /** 검색 대상. `searchKeyword`와 함께 사용하며 생략하면 `all`입니다. */
    searchType?: "all" | "subject" | "memo" | "name" | "subject_m";
    /** 추천글만 조회할지 여부입니다. */
    recommend?: boolean;
    /** 공지만 조회할지 여부입니다. */
    notice?: boolean;
    /** 말머리 ID 필터입니다. */
    headId?: number;
};

/** 갤러리 메타데이터 원본(`gall_info`)입니다. */
export interface GalleryInfo {
    gall_title: string;
    category: number;
    file_cnt: number;
    file_size: number;
    no_write: boolean;
    captcha: boolean | null;
    code_count: number | null;
    use_ai_write: boolean | null;
    is_minor: boolean;
    is_mini: boolean;
    is_person: boolean;
    managerskill: boolean;
    membership: boolean | null;
    profile_img: string | null;
    prgall_img: string | null;
    is_prgall_certified: boolean | null;
    prgall_profile: Array<{ name: string; value: string }>;
    total_member: number | null;
    member_join: boolean | null;
    use_auto_delete: number | null;
    use_list_fix: boolean | null;
    notify_recent: number | null;
    head_text_up_dt: number | null;
    placeholder: Array<{ no: number; msg: string }>;
    must_read: { no: number; subject: string } | Record<string, never>;
    anonymous: string | null;
    capture_nickname: string | null;
    gall_nickname: string | null;
    relation_gall: Record<string, string>;
    head_text: HeadText[];
}

/** 게시글 목록 항목 원본(`gall_list` 요소)입니다. */
export interface ArticleListItem {
    no: string | number;
    headnum: number;
    hit: number;
    recommend: number;
    img_icon: string;
    movie_icon: string;
    recommend_icon: string;
    best_chk: string;
    realtime_chk: string;
    realtime_l_chk: string;
    voice_icon: string;
    winnerta_icon: string;
    level: number;
    total_comment: number;
    total_voice: number;
    user_id: string;
    member_icon: number;
    ip: string;
    gallercon: string | null;
    subject: string;
    name: string;
    date_time: string;
    head_text?: string;
    headtext?: string;
}

/** 게시글 목록 응답 원본입니다. */
export interface ArticleListResult {
    gall_info: GalleryInfo;
    gall_list: ArticleListItem[];
}

export type ArticleReadOptions = GalleryTarget & {
    /** 게시글 번호. DCInside API의 `no` 값입니다. */
    articleId: number;
};

/** 게시글 본문/추천 정보 원본(`view_main`)입니다. */
export interface ArticleViewMain {
    memo: string;
    recommend: number;
    recommend_member: number;
    nonrecommend: number;
    nonrecomm_use: boolean | null;
    managerskill: boolean;
}

/** 게시글 상세 정보 원본(`view_info`)입니다. */
export interface ArticleViewInfo {
    galltitle: string;
    category: number;
    subject: string;
    no: string | number;
    name: string;
    level: number;
    member_icon: number;
    total_comment: number;
    ip: string;
    img_chk: string;
    recommend_chk: string;
    winnerta_chk: string;
    voice_chk: string;
    hit: number;
    write_type: string;
    user_id: string;
    prev_link: number;
    prev_subject: string;
    headtitle: string;
    headid: number | null;
    next_link: number;
    next_subject: string;
    best_chk: string;
    realtime_l_chk: string;
    isNotice: string;
    alarm_flag: number | null;
    gallercon: string | null;
    date_time: string;
    is_minor: boolean;
    is_mini: boolean;
    is_person: boolean;
    use_auto_delete: number | null;
    use_list_fix: boolean | null;
    membership: boolean | null;
    member_grant: number | null;
    comment_captcha: boolean | null;
    comment_code_count: number | null;
    recommend_captcha: boolean | null;
    recommend_captcha_type: string | null;
    recommend_code_count: number | null;
    anonymous: string | null;
    capture_nickname: string | null;
    gall_nickname: string | null;
    profile_img: string | null;
    head_text: HeadText[];
    commentDel_scope: boolean;
}

/** 게시글 읽기 응답 원본입니다. */
export interface ArticleReadResult {
    view_info: ArticleViewInfo;
    view_main: ArticleViewMain;
}

export type ArticleContent =
/** 일반 텍스트 블록. HTML 이스케이프 후 `<div>`로 감싸 전송합니다. */
    | string
    | {
    /** 일반 텍스트 블록. HTML 이스케이프 후 `<div>`로 감싸 전송합니다. */
    type: "text";
    /** 이 블록에 들어갈 텍스트입니다. */
    text: string;
}
    | {
    /** 원본 HTML 블록. 신뢰한 HTML에만 사용하세요. */
    type: "html";
    /** 하나의 memo block으로 전송할 HTML입니다. */
    html: string;
}
    | {
    /** Markdown 형태의 텍스트 블록. 현재는 렌더링하지 않고 이스케이프된 텍스트로 전송합니다. */
    type: "markdown";
    /** 이스케이프된 텍스트로 전송할 Markdown 원문입니다. */
    markdown: string;
}
    | {
    /** 업로드 이미지 블록입니다. */
    type: "image";
    /** 첨부할 이미지 Blob/File입니다. */
    file: Blob | File;
    /** 호출 측에서 MIME 메타데이터를 보관해야 할 때 사용할 수 있는 값입니다. */
    mimeType?: string;
}
    | {
    /** `client.dccons.insert(...)`로 발급받은 디시콘 블록입니다. */
    type: "dccon";
    /** 디시콘 삽입 API가 반환한 `imageTag` 값입니다. */
    imageTag: string;
    /** 디시콘 상세 인덱스입니다. */
    detailIndex: number;
};

export type ArticleWriteOptions = GalleryTarget & {
    /** 게시글 제목. 공백뿐이면 요청 전에 거부합니다. */
    subject: string;
    /** 순서대로 전송할 본문 블록. 최소 한 개가 필요합니다. */
    content: ArticleContent[];
    /** 기존 게시글 번호. `mode`가 `modify`이면 필수입니다. */
    articleId?: number;
    /** 말머리가 필요하거나 지원되는 갤러리에서 선택한 말머리입니다. */
    headText?: Pick<HeadText, "no" | "name">;
    /** 새 글 작성 또는 기존 글 수정 모드. 생략하면 `write`입니다. */
    mode?: "write" | "modify";
    /** 캡챠(보안코드) 답변입니다. 서버가 캡챠를 요구할 때 전달합니다. */
    captcha?: CaptchaAnswer;
    /** 성인 인증 코드입니다. 성인 갤러리 글 작성 시 필요할 수 있습니다. */
    adultCode?: string;
};

/** 게시글 작성/수정 응답 원본입니다. 성공 시 `cause`에 게시글 번호가 들어갑니다. */
export interface ArticleWriteResult {
    result: boolean;
    cause: string | number | null;
    id: string | null;
}

export type ArticleDeleteOptions = GalleryTarget & {
    articleId: number;
};

/** 게시글 삭제 응답 원본입니다. */
export interface ArticleDeleteResult {
    result: boolean;
    cause: string | null;
    message: string | null;
    status: number | null;
}

export type ArticleVoteOptions = GalleryTarget & {
    articleId: number;
    /** 캡챠(보안코드) 답변입니다. 서버가 캡챠를 요구할 때 전달합니다. */
    captcha?: CaptchaAnswer;
};

/** 게시글 추천/비추천 응답 원본입니다. */
export interface ArticleVoteResult {
    result: boolean;
    cause: string | null;
    member: number | null;
}

export type ArticleModifyInfoOptions = GalleryTarget & {
    articleId: number;
};

/** 게시글 수정 화면 응답 원본입니다. `memo`와 `file`은 DCInside 중첩 구조 그대로입니다. */
export interface ArticleModifyInfoResult {
    result: boolean;
    gall_id: string | null;
    gall_no: number;
    file_cnt: number;
    file_size: number;
    subject: string | null;
    memo: unknown[];
    file: unknown[];
    head_text: HeadText[];
    headtext: string | null;
    cause: string | null;
}