import {createHash} from "node:crypto";
import {APP, FIREBASE, HOST} from "../constants";
import {ApiError, CaptchaRequiredError, DCInsideError, OtpRequiredError} from "../errors";
import type {Http} from "../http";
import type {LoginResult} from "../types/responses";
import {first, isCaptchaCause} from "../util";
import {type CheckinCredentials, createCheckinRequest, parseCheckinResponse} from "./checkin";

export type {CheckinCredentials};

/** 파일/DB에 저장했다가 `credentials` 옵션으로 되살릴 수 있는 디바이스 인증 정보입니다. */
export interface DeviceCredentials {
    androidId: string;
    securityToken: string;
    fid: string;
    refreshToken: string;
    clientToken: string;
    appId: string | null;
    appIdIssuedAt: number | null;
}

/** 캡챠 답입니다. `key`는 이미지를 요청할 때 쓴 `dccode`, `code`는 사용자가 읽은 글자입니다. */
export interface CaptchaAnswer {
    key: string;
    code: string;
}

export interface LoginOptions {
    /** OTP 6자리입니다. */
    otp?: string;
    /** 이전 로그인 응답의 `otp_token`입니다. 있으면 OTP 없이 통과합니다. */
    otpToken?: string;
    captcha?: CaptchaAnswer;
    /** 기본 `login_normal`입니다. 자동 재로그인은 앱처럼 `login_quick`을 씁니다. */
    mode?: "login_normal" | "login_quick";
}

export interface AnonymousSession {
    type: "anonymous";
    nickname: string;
    password: string;
}

export interface LoginSession {
    type: "login";
    id: string;
    password: string;
    /** 서버가 돌려준 사용자 식별자(`user_id`)입니다. 요청의 `confirm_id`/`user_id`에 씁니다. */
    userId: string;
    result: LoginResult;
}

export type Session = AnonymousSession | LoginSession;

/** 앱이 `app_id`를 약 11시간 재사용하는 것과 같게 맞춥니다. */
const APP_ID_TTL = 11 * 60 * 60 * 1000;

/**
 * 디바이스 인증(`client_token`, `app_id`)과 로그인을 담당합니다.
 *
 * 흐름: Google checkin → Firebase Installation → GCM register3(`client_token`)
 * → `app_check` 날짜 토큰 → `mobile_app_verification`(`app_id`). 앱에서는 마지막 두 단계가
 * 네이티브 라이브러리(`libnative-lib.so`) 안에 있습니다.
 */
export class Auth {
    /** 새 app_id를 받은 뒤 기다리는 시간(ms)입니다. 갓 발급된 app_id는 잠시 certification 오류가 납니다. */
    appIdSettleMs = 5000;
    private checkin: CheckinCredentials | null = null;
    private fid: string | null = null;
    private refreshToken: string | null = null;
    private clientToken: string | null = null;
    private appIdValue: string | null = null;
    private appIdIssuedAt: number | null = null;
    private pendingAppId: Promise<string> | null = null;
    private pendingClientToken: Promise<string> | null = null;

    constructor(private readonly http: Http) {
    }

    /** 발급된 FCM `client_token`입니다. 발급 전에는 `null`입니다. */
    get fcmToken(): string | null {
        return this.clientToken;
    }

    /** `app_id`를 돌려줍니다. 없거나 11시간이 지났으면 새로 발급합니다. */
    async appId(): Promise<string> {
        if (this.appIdValue && this.appIdIssuedAt && Date.now() - this.appIdIssuedAt < APP_ID_TTL) return this.appIdValue;
        this.pendingAppId ??= this.issueAppId().finally(() => (this.pendingAppId = null));
        return this.pendingAppId;
    }

    /** 캐시된 `app_id`를 버리고 다시 발급합니다. */
    refreshAppId(): Promise<string> {
        this.appIdValue = null;
        return this.appId();
    }

    /** checkin → Firebase → GCM으로 `client_token`을 발급하거나 캐시를 돌려줍니다. */
    async ensureClientToken(): Promise<string> {
        if (this.clientToken) return this.clientToken;
        this.pendingClientToken ??= this.issueClientToken().finally(() => (this.pendingClientToken = null));
        return this.pendingClientToken;
    }

    exportCredentials(): DeviceCredentials | null {
        if (!this.checkin || !this.fid || !this.refreshToken || !this.clientToken) return null;
        return {
            androidId: this.checkin.androidId.toString(),
            securityToken: this.checkin.securityToken.toString(),
            fid: this.fid,
            refreshToken: this.refreshToken,
            clientToken: this.clientToken,
            appId: this.appIdValue,
            appIdIssuedAt: this.appIdIssuedAt
        };
    }

    importCredentials(credentials: DeviceCredentials): void {
        this.checkin = {androidId: BigInt(credentials.androidId), securityToken: BigInt(credentials.securityToken)};
        this.fid = credentials.fid;
        this.refreshToken = credentials.refreshToken;
        this.clientToken = credentials.clientToken;
        this.appIdValue = credentials.appId;
        this.appIdIssuedAt = credentials.appIdIssuedAt;
    }

    /**
     * 아이디/비밀번호로 로그인합니다.
     *
     * @throws OtpRequiredError OTP가 필요할 때
     * @throws CaptchaRequiredError 캡챠가 필요할 때
     * @throws ApiError 그 밖의 로그인 실패
     */
    async login(id: string, password: string, options: LoginOptions = {}): Promise<LoginSession> {
        const result = await this.http.post<LoginResult>(`${HOST.sign}/api/login`, {
            user_id: id,
            user_pw: password,
            rand_code: options.captcha?.key,
            captcha_code: options.captcha?.code,
            mode: options.mode ?? "login_normal",
            client_token: await this.ensureClientToken(),
            otp_num: options.otp,
            otp_auto: options.otpToken,
            auth_mode: options.otp ? "otp" : undefined
        }, {raw: true});

        if (result.result === true && result.user_id) return {type: "login", id, password, userId: result.user_id, result};

        const cause = result.cause ?? "로그인에 실패했습니다.";
        if (result.is_otp === "1" || /otp|2차/i.test(cause)) throw new OtpRequiredError(cause, result);
        if (isCaptchaCause(cause)) throw new CaptchaRequiredError(cause, result);
        throw new ApiError(cause, result);
    }

    private async issueAppId(): Promise<string> {
        const clientToken = await this.ensureClientToken();
        const response = await this.http.post<{ app_id?: string }>(`${HOST.sign}/auth/mobile_app_verification`, {
            value_token: await this.valueToken(),
            signature: APP.signature,
            pkg: APP.package,
            vCode: APP.versionCode,
            vName: APP.versionName,
            client_token: clientToken
        }, {appId: false, raw: true});
        if (!response.app_id) throw new DCInsideError(`app_id 발급 실패: ${JSON.stringify(response)}`);
        await new Promise((resolve) => setTimeout(resolve, this.appIdSettleMs));
        this.appIdValue = response.app_id;
        this.appIdIssuedAt = Date.now();
        return response.app_id;
    }

    /** `SHA-256("dcArdchk_" + app_check.date)` 입니다. */
    private async valueToken(): Promise<string> {
        const check = first(await this.http.get(`${HOST.json2}/json0/app_check_A_rina_one_new.php`, {}, {appId: false, raw: true}));
        const date = check["date"];
        if (typeof date !== "string" || !date) throw new DCInsideError("app_check 응답에 date가 없습니다.");
        return createHash("sha256").update(`dcArdchk_${date}`).digest("hex");
    }

    private async issueClientToken(): Promise<string> {
        this.checkin ??= await this.androidCheckin();
        const authToken = await this.firebaseInstallation();
        const token = await this.register(authToken, {"X-subtype": FIREBASE.sender, sender: FIREBASE.sender, "X-scope": "*"});
        // 앱이 구독하는 토픽입니다. 실패해도 토큰 사용에는 지장이 없습니다.
        await Promise.allSettled(["/topics/DcRefreshRemoteConfig", "/topics/DcShowNoticeMessage"].map((topic) =>
            this.register(authToken, {"X-gcm.topic": topic, "X-subtype": token, sender: token, "X-scope": topic})));
        this.clientToken = token;
        return token;
    }

    private async androidCheckin(): Promise<CheckinCredentials> {
        const response = await this.http.fetch("https://android.clients.google.com/checkin", {
            method: "POST",
            headers: {"Content-Type": "application/x-protobuf"},
            body: createCheckinRequest()
        });
        return parseCheckinResponse(new Uint8Array(await response.arrayBuffer()));
    }

    /** Firebase Installation을 만들거나 갱신하고 auth token을 돌려줍니다. */
    private async firebaseInstallation(): Promise<string> {
        const response = await this.http.fetch(`https://firebaseinstallations.googleapis.com/v1/projects/${FIREBASE.projectId}/installations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Android-Package": APP.package,
                "X-Android-Cert": FIREBASE.cert,
                "x-firebase-client": FIREBASE.firebaseClient,
                "x-goog-api-key": FIREBASE.apiKey,
                "User-Agent": FIREBASE.dalvikUserAgent
            },
            body: JSON.stringify({
                appId: FIREBASE.appId,
                authVersion: "FIS_v2",
                sdkVersion: FIREBASE.installationsSdk,
                ...(this.fid ? {fid: this.fid} : {}),
                ...(this.refreshToken ? {refreshToken: this.refreshToken} : {})
            })
        });
        const json = await response.json() as { fid?: string; refreshToken?: string; authToken?: { token?: string } };
        if (!json.fid || !json.refreshToken || !json.authToken?.token) {
            throw new DCInsideError(`Firebase Installation 실패: ${JSON.stringify(json)}`);
        }
        this.fid = json.fid;
        this.refreshToken = json.refreshToken;
        return json.authToken.token;
    }

    private async register(installationAuthToken: string, extra: Record<string, string>): Promise<string> {
        const checkin = this.checkin!;
        const response = await this.http.fetch("https://android.apis.google.com/c2dm/register3", {
            method: "POST",
            headers: {
                Authorization: `AidLogin ${checkin.androidId}:${checkin.securityToken}`,
                app: APP.package,
                gcm_ver: FIREBASE.gmsVersion,
                app_ver: APP.versionCode,
                "User-Agent": FIREBASE.gmsUserAgent
            },
            body: new URLSearchParams({
                ...extra,
                "X-app_ver": APP.versionCode,
                "X-osv": FIREBASE.osVersion,
                "X-cliv": FIREBASE.cliv,
                "X-gmsv": FIREBASE.gmsVersion,
                "X-appid": this.fid ?? "",
                "X-Goog-Firebase-Installations-Auth": installationAuthToken,
                "X-gmp_app_id": FIREBASE.appId,
                "X-firebase-app-name-hash": FIREBASE.appNameHash,
                "X-app_ver_name": APP.versionName,
                app: APP.package,
                device: String(checkin.androidId),
                app_ver: APP.versionCode,
                info: FIREBASE.info,
                gcm_ver: FIREBASE.gmsVersion,
                plat: "0",
                cert: FIREBASE.cert,
                target_ver: FIREBASE.targetSdk
            })
        });
        const text = await response.text();
        const token = new URLSearchParams(text).get("token");
        if (!token) throw new DCInsideError(`GCM 등록 실패: ${text}`);
        return token;
    }
}
