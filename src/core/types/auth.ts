export type User =
    | {
    type: "anonymous";
    id: string;
    password: string;
}
    | {
    type: "login";
    id: string;
    password: string;
};

/** 로그인 입력 파라미터입니다. */
export interface LoginInput {
    /** DCInside 아이디입니다. */
    id: string;
    /** DCInside 비밀번호입니다. */
    password: string;
    /** 2차 인증(OTP) 번호입니다. OTP가 필요한 계정이면 전달합니다. */
    otp?: string;
    /** 로그인 캡챠 답변입니다. 서버가 캡챠를 요구할 때 전달합니다. */
    captcha?: import("./captcha").CaptchaAnswer;
    /** 로그인 모드. 생략하면 `login_quick`으로 시도 후 필요시 `login_normal`로 재시도합니다. */
    mode?: "login_quick" | "login_normal";
}

export interface SessionDetail {
    result: boolean;
    userId: string;
    userNo: string;
    name: string;
    sessionType: string;
    isAdult: number;
    isDormancy: number;
    isOtp: number;
    pwCampaign: number;
    mailSend: string;
    isGonick: number;
    isSecurityCode: string;
    authChange: number;
    cause: string | null;
}

export interface Session {
    user: User;
    detail: SessionDetail | null;
}

export interface FirebaseInstallation {
    fid: string;
    refreshToken: string;
    authToken: string;
    raw: unknown;
}

export interface AndroidCheckinCredentials {
    androidId: string | number | bigint;
    securityToken: string | number | bigint;
}

export interface ClientTokenResult {
    clientToken: string;
    installation: FirebaseInstallation;
    remoteConfig: unknown;
}

/** 재사용 가능한 디바이스 인증 정보입니다. `exportCredentials`와 `importCredentials`로 저장하고 복원합니다. */
export interface DeviceCredentials {
    /** Google checkin으로 발급받은 기기 식별값. */
    androidId: string;
    /** Google checkin으로 발급받은 보안 토큰. */
    securityToken: string;
    /** Firebase Installation ID. */
    fid: string;
    /** Firebase Installation refresh token. */
    refreshToken: string;
    /** GCM register3으로 발급받은 FCM client_token. */
    clientToken: string;
    /** DCInside 서버에서 발급받은 app_id. */
    appId: string;
    /** app_id 발급 시각 (epoch ms). */
    appIdIssuedAt: number;
    /** app_check date 캐시 값. */
    appCheckDate: string | null;
    /** app_check 마지막 호출 시각 (epoch ms). */
    lastAppCheckTime: number | null;
}