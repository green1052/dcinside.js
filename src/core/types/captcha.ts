/** 캡챠 답변입니다. 글/댓글 작성, 추천, 로그인에서 사용합니다. */
export interface CaptchaAnswer {
    /** 사용자가 입력한 보안코드입니다. */
    code: string;
    /** 캡챠 세션 식별자입니다. 생략하면 `captcha` 필드를 사용합니다. */
    dccode?: string;
    /** 레거시 캡챠 세션 식별자입니다. */
    captcha?: string;
}

/** 캡챠 챌린지 정보입니다. 서버가 캡챠를 요구할 때 에러와 함께 전달됩니다. */
export interface CaptchaChallenge {
    /** 캡챠 이미지 URL입니다. */
    imageUrl?: string;
    /** 캡챠 세션 식별자입니다. */
    captcha?: string;
}