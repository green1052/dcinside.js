import {buildFormData, type KyHttpClient} from "../http";
import {assertAuthExpired, authExpiredKind} from "../http/api-error";
import {API_URL, DC_APP, FIREBASE} from "../http/constants";
import {AuthenticationError, AuthExpiredError, LoginCaptchaRequiredError, LoginOtpRequiredError} from "../http/errors";
import {arrayValue, booleanValue, nullableString, numberValue, objectValue, stringValue} from "../http/json";
import {sha256Hex} from "../http/utils";
import type {
    AndroidCheckinCredentials,
    ClientTokenResult,
    DeviceCredentials,
    FirebaseInstallation,
    LoginInput,
    Session,
    SessionDetail
} from "../types";
import {createAndroidCheckinRequest, parseAndroidCheckinResponse} from "./checkin";

const APP_ID_TTL_MS = 39_600_000;

/**
 * DCInside 앱 인증과 세션을 관리합니다.
 *
 * Android checkin → Firebase installation → GCM register3 → app_id 발급 흐름을
 * 한 곳에 모아두고, 발급된 디바이스 인증 정보는 내보내거나 다시 가져올 수 있습니다.
 */
export class AuthManager {
    private appId: string | null = null;
    private appIdIssuedAt: number | null = null;
    private clientToken: string | null = null;
    private lastHash: string | null = null;
    private fid: string | null = null;
    private refreshToken: string | null = null;
    private appCheckDate: string | null = null;
    private lastAppCheckTime: Date | null = null;
    private checkinCredentials: AndroidCheckinCredentials | null = null;

    constructor(private readonly http: KyHttpClient) {
    }

    /** FCM/GCM 등록으로 얻은 `client_token`입니다. 아직 발급되지 않았으면 `null`입니다. */
    get fcmToken(): string | null {
        return this.clientToken;
    }

    /** 현재 Firebase Installation ID(FID)입니다. 발급 전에는 `null`입니다. */
    get firebaseInstallationId(): string | null {
        return this.fid;
    }

    /** Firebase Installation refresh token입니다. 발급 전에는 `null`입니다. */
    get firebaseRefreshToken(): string | null {
        return this.refreshToken;
    }

    /**
     * Android checkin 자격증명을 고정값으로 설정합니다.
     *
     * @param credentials Google checkin에서 받은 `androidId`와 `securityToken`입니다.
     */
    setCheckinCredentials(credentials: { androidId: string; securityToken: string }): void {
        this.checkinCredentials = {
            androidId: BigInt(credentials.androidId),
            securityToken: BigInt(credentials.securityToken)
        };
    }

    /**
     * 외부에서 얻은 `app_id`를 현재 인증 상태에 주입합니다.
     *
     * @param appId DCInside 앱 API 요청에 사용할 `app_id`입니다.
     */
    useAppId(appId: string): void {
        this.appId = appId;
        this.appIdIssuedAt = Date.now();
        this.lastHash = null;
    }

    /**
     * `app_id`가 발급되어 있도록 준비합니다.
     *
     * @returns 체이닝을 위한 현재 인증 매니저입니다.
     */
    async ready(): Promise<this> {
        await this.getAppId();
        return this;
    }

    /**
     * 캐시된 `app_id`를 무효화하고 다시 발급받습니다.
     *
     * @param options `refreshClientToken`이 `true`이면 `client_token`과 checkin/Firebase 상태도 함께 초기화합니다.
     * @returns 새로 발급되었거나 재사용 가능한 `app_id`입니다.
     */
    async refreshAppId(options: { refreshClientToken?: boolean } = {}): Promise<string> {
        this.appId = null;
        this.appIdIssuedAt = null;
        this.lastHash = null;
        if (options.refreshClientToken) {
            this.clientToken = null;
            this.checkinCredentials = null;
            this.refreshToken = null;
            this.fid = null;
        }
        return this.getAppId();
    }

    /**
     * 캐시된 `app_id`를 반환하거나 새로 발급받습니다.
     * 공식 앱과 동일하게 발급 후 약 11시간 동안 저장된 `app_id`를 우선 재사용합니다.
     * 새로 발급받은 `app_id`는 서버 검증이 완료될 때까지 대기합니다.
     */
    async getAppId(): Promise<string> {
        if (this.appId && this.shouldReuseCachedAppId()) {
            return this.appId;
        }

        const hashedAppKey = await this.generateHashedAppKey();
        if (this.lastHash === hashedAppKey && this.appId) return this.appId;

        this.appId = await this.fetchAppId(hashedAppKey);
        this.appIdIssuedAt = Date.now();
        this.lastHash = hashedAppKey;
        await this.waitForAppIdVerification();
        return this.appId;
    }

    /**
     * Firebase Installations API로 FID, refresh token, auth token을 발급받습니다.
     *
     * @param options 기존 FID와 refresh token을 이어서 사용할 때 전달합니다.
     * @returns Firebase 설치 식별자와 인증 토큰입니다.
     */
    async fetchFirebaseInstallation(options: {
        fid?: string;
        refreshToken?: string
    } = {}): Promise<FirebaseInstallation> {
        const body: Record<string, string> = {
            appId: FIREBASE.appId,
            authVersion: FIREBASE.authVersion,
            sdkVersion: FIREBASE.sdkVersion
        };

        const existingFid = options.fid ?? this.fid;
        const existingRefreshToken = options.refreshToken ?? this.refreshToken;
        if (existingFid) body["fid"] = existingFid;
        if (existingRefreshToken) body["refreshToken"] = existingRefreshToken;

        const json = objectValue(await this.http.ky.post(API_URL.firebase.installations, {
            headers: {
                "Content-Type": "application/json",
                "X-Android-Package": DC_APP.package,
                "X-Android-Cert": FIREBASE.cert,
                "x-firebase-client": FIREBASE.firebaseClient,
                "x-goog-api-key": FIREBASE.apiKey,
                "User-Agent": FIREBASE.registerUserAgent
            },
            json: body
        }).json());

        const fid = nullableString(json["fid"]);
        const refreshToken = nullableString(json["refreshToken"]);
        const authToken = nullableString(objectValue(json["authToken"])["token"]);

        if (!fid || !refreshToken || !authToken) {
            throw new AuthenticationError(`Unable to fetch Firebase installation: ${JSON.stringify(json)}`);
        }

        this.fid = fid;
        this.refreshToken = refreshToken;

        return {
            fid,
            refreshToken,
            authToken,
            raw: json
        };
    }

    /**
     * DCInside 아이디와 비밀번호로 로그인하여 세션을 생성합니다.
     *
     * `login_quick` 모드로 먼저 시도하고, "간편 아이디 삭제"/"다시 로그인" cause가 반환되면
     * `login_normal` 모드로 자동 재시도합니다. OTP 2차 인증이나 캡챠가 필요하면
     * 각각 `LoginOtpRequiredError`/`LoginCaptchaRequiredError`를 throw 합니다.
     *
     * @param input 로그인 입력 파라미터입니다.
     * @returns 로그인 사용자 정보와 서버가 반환한 세션 상세 정보입니다.
     */
    async login(input: LoginInput): Promise<Session> {
        if (!this.clientToken) this.clientToken = await this.fetchClientToken();
        const mode = input.mode ?? "login_quick";
        let detail = await this.requestLogin({
            id: input.id,
            password: input.password,
            mode,
            ...(input.otp ? {otp: input.otp} : {}),
            ...(input.captcha ? {captcha: input.captcha} : {})
        });
        if (!detail.result && mode === "login_quick" && shouldRetryNormalLogin(detail.cause)) {
            detail = await this.requestLogin({
                id: input.id,
                password: input.password,
                mode: "login_normal",
                ...(input.otp ? {otp: input.otp} : {}),
                ...(input.captcha ? {captcha: input.captcha} : {})
            });
        }
        if (!detail.result) {
            const cause = detail.cause ?? "Login failed.";
            const kind = authExpiredKind(cause);
            if (kind) throw new AuthExpiredError(kind, cause);
            throw new AuthenticationError(cause);
        }
        return {
            user: {type: "login", id: input.id, password: input.password},
            detail
        };
    }

    /**
     * 익명 작성용 세션을 로컬에 생성합니다.
     *
     * @param id 익명 닉네임입니다.
     * @param password 글과 댓글 삭제에 사용할 비밀번호입니다.
     * @returns 네트워크 요청 없이 생성한 익명 세션입니다.
     */
    createAnonymousSession(id: string, password: string): Session {
        return {
            user: {
                type: "anonymous",
                id,
                password
            },
            detail: null
        };
    }

    /**
     * `app_check` 날짜 토큰 기반으로 SHA-256 해시 app key를 생성합니다.
     *
     * 같은 시(서울 기준) 안에서는 `app_check`를 다시 호출하지 않고 캐시된 날짜 토큰을 재사용합니다.
     */
    async generateHashedAppKey(): Promise<string> {
        const now = new Date();
        if (this.appCheckDate && this.lastAppCheckTime && !this.needsAppCheckRefresh(this.lastAppCheckTime, now)) {
            return sha256Hex(`dcArdchk_${this.appCheckDate}`);
        }

        const date = await this.fetchAppCheckDate();
        this.appCheckDate = date;
        this.lastAppCheckTime = now;
        return sha256Hex(`dcArdchk_${date}`);
    }

    /**
     * 현재 인증 상태를 직렬화 가능한 객체로 추출합니다.
     *
     * @returns 파일이나 DB에 저장해 재사용할 수 있는 인증 정보입니다. 필수 값이 아직 없으면 `null`입니다.
     */
    exportCredentials(): DeviceCredentials | null {
        if (!this.appId || !this.clientToken || !this.fid || !this.refreshToken || !this.checkinCredentials) {
            return null;
        }
        return {
            androidId: this.checkinCredentials.androidId.toString(),
            securityToken: this.checkinCredentials.securityToken.toString(),
            fid: this.fid,
            refreshToken: this.refreshToken,
            clientToken: this.clientToken,
            appId: this.appId,
            appIdIssuedAt: this.appIdIssuedAt ?? Date.now(),
            appCheckDate: this.appCheckDate,
            lastAppCheckTime: this.lastAppCheckTime ? this.lastAppCheckTime.getTime() : null
        };
    }

    /**
     * checkin → Firebase → GCM 흐름을 실행해 `client_token`을 발급받습니다.
     *
     * @returns 발급되었거나 캐시된 FCM `client_token`입니다.
     */
    async fetchClientToken(): Promise<string> {
        if (this.clientToken) return this.clientToken;

        if (!this.checkinCredentials) this.checkinCredentials = await this.fetchAndroidCheckin();
        const result = await this.fetchClientTokenWithCheckin(this.checkinCredentials);
        return result.clientToken;
    }

    /**
     * Google Android checkin 프로토콜로 `androidId`와 `securityToken`을 발급받습니다.
     *
     * @returns 발급되었거나 캐시된 checkin 자격증명입니다.
     */
    async fetchAndroidCheckin(): Promise<AndroidCheckinCredentials> {
        if (this.checkinCredentials) return this.checkinCredentials;
        const response = await this.http.ky.post(API_URL.playService.checkin, {
            headers: {"content-type": "application/x-protobuf"},
            body: createAndroidCheckinRequest()
        }).arrayBuffer();
        this.checkinCredentials = parseAndroidCheckinResponse(new Uint8Array(response));
        return this.checkinCredentials;
    }

    /**
     * 이미 받은 checkin 자격증명으로 `client_token` 발급 흐름을 실행합니다.
     *
     * @param checkin Google Android checkin 자격증명입니다.
     * @returns `client_token`, Firebase 설치 정보, Remote Config 원본 응답입니다.
     */
    async fetchClientTokenWithCheckin(checkin: AndroidCheckinCredentials): Promise<ClientTokenResult> {
        const installation = await this.fetchFirebaseInstallation();
        const clientToken = await this.registerGcm(checkin, installation.authToken);

        await Promise.all([
            this.subscribeGcmScope(checkin, clientToken, installation.authToken, "/topics/DcRefreshRemoteConfig"),
            this.subscribeGcmScope(checkin, clientToken, installation.authToken, "/topics/DcShowNoticeMessage")
        ]);

        const remoteConfig = await this.fetchRemoteConfig(installation.authToken);
        this.clientToken = clientToken;

        return {
            clientToken,
            installation,
            remoteConfig
        };
    }

    /**
     * GCM Authorization 헤더용 AidLogin 토큰 문자열을 만듭니다.
     *
     * @param checkin Google Android checkin 자격증명입니다.
     * @returns `AidLogin androidId:securityToken` 형식의 헤더 값입니다.
     */
    generateAidLogin(checkin: AndroidCheckinCredentials): string {
        return `AidLogin ${checkin.androidId}:${checkin.securityToken}`;
    }

    /**
     * 외부에서 저장한 인증 정보를 복원합니다.
     *
     * @param creds `exportCredentials`로 추출했거나 같은 형태로 저장한 디바이스 인증 정보입니다.
     */
    importCredentials(creds: DeviceCredentials): void {
        this.checkinCredentials = {
            androidId: BigInt(creds.androidId),
            securityToken: BigInt(creds.securityToken)
        };
        this.fid = creds.fid;
        this.refreshToken = creds.refreshToken;
        this.clientToken = creds.clientToken;
        this.appId = creds.appId;
        this.appIdIssuedAt = creds.appIdIssuedAt;
        this.lastHash = null;
        this.appCheckDate = creds.appCheckDate;
        this.lastAppCheckTime = creds.lastAppCheckTime != null ? new Date(creds.lastAppCheckTime) : null;
    }

    /** 로그인 API 요청을 전송하고 세부 정보를 파싱합니다. */
    private async requestLogin(input: {
        id: string;
        password: string;
        mode: "login_quick" | "login_normal";
        otp?: string;
        captcha?: import("../types").CaptchaAnswer;
    }): Promise<SessionDetail> {
        const params = new URLSearchParams({
            client_token: this.clientToken ?? "",
            mode: input.mode,
            user_id: input.id,
            user_pw: input.password
        });
        if (input.captcha) {
            params.set("rand_code", input.captcha.dccode ?? input.captcha.captcha ?? "");
            params.set("captcha_code", input.captcha.code);
        }
        if (input.otp) {
            params.set("auth_mode", "otp");
            params.set("otp_num", input.otp);
        }

        const json = objectValue(await this.http.ky.post(API_URL.auth.login, {
            headers: {
                "User-Agent": DC_APP.userAgent,
                Referer: DC_APP.referer
            },
            body: params
        }).json());

        const detail: SessionDetail = {
            result: booleanValue(json["result"]),
            userId: stringValue(json["user_id"]),
            userNo: stringValue(json["user_no"]),
            name: stringValue(json["name"]),
            sessionType: stringValue(json["stype"]),
            isAdult: numberValue(json["is_adult"]),
            isDormancy: numberValue(json["is_dormancy"]),
            isOtp: numberValue(json["is_otp"]),
            pwCampaign: numberValue(json["pw_campaign"]),
            mailSend: stringValue(json["mail_send"]),
            isGonick: numberValue(json["is_gonick"]),
            isSecurityCode: stringValue(json["is_security_code"]),
            authChange: numberValue(json["auth_change"]),
            cause: nullableString(json["cause"])
        };

        if (detail.result) return detail;

        const cause = detail.cause ?? "";
        assertAuthExpired(cause);
        if (isLoginOtpCause(cause) || detail.isOtp === 1) {
            throw new LoginOtpRequiredError(cause || "OTP 2차 인증이 필요합니다.");
        }
        if (isLoginCaptchaCause(cause)) {
            throw new LoginCaptchaRequiredError(cause || "로그인 보안코드 입력이 필요합니다.");
        }
        return detail;
    }

    /** 서버에서 `app_id`를 발급받습니다. */
    private async fetchAppId(hashedAppKey: string): Promise<string> {
        if (!this.clientToken) this.clientToken = await this.fetchClientToken();

        const body = buildFormData({
            value_token: hashedAppKey,
            signature: DC_APP.signature,
            pkg: DC_APP.package,
            vCode: DC_APP.versionCode,
            vName: DC_APP.versionName,
            client_token: this.clientToken
        });

        const json = objectValue(await this.http.ky.post(API_URL.auth.appId, {
            headers: {
                "User-Agent": DC_APP.userAgent,
                Referer: DC_APP.referer
            },
            body
        }).json());

        const appId = nullableString(json["app_id"]);

        if (!appId) {
            throw new AuthenticationError(`Unable to fetch app_id: ${JSON.stringify(json)}`);
        }
        return appId;
    }

    /** 이전 `app_check` 시간과 현재 시간이 다른 년/월/일/시인지 서울 기준으로 확인합니다. */
    private needsAppCheckRefresh(old: Date, now: Date): boolean {
        const fmt = new Intl.DateTimeFormat("en-CA", {
            year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit",
            hour12: false, timeZone: "Asia/Seoul"
        });
        const oldParts = fmt.formatToParts(old);
        const newParts = fmt.formatToParts(now);
        const get = (parts: Intl.DateTimeFormatPart[], type: string) =>
            parts.find((p) => p.type === type)?.value ?? "";
        return get(oldParts, "year") !== get(newParts, "year")
            || get(oldParts, "month") !== get(newParts, "month")
            || get(oldParts, "day") !== get(newParts, "day")
            || get(oldParts, "hour") !== get(newParts, "hour");
    }

    private async registerGcm(checkin: AndroidCheckinCredentials, installationAuthToken: string): Promise<string> {
        const response = await this.http.ky.post(API_URL.playService.register3, {
            headers: this.gcmHeaders(checkin),
            body: new URLSearchParams(this.gcmForm({
                subtype: FIREBASE.sender,
                sender: FIREBASE.sender,
                scope: "*",
                installationAuthToken,
                device: String(checkin.androidId)
            }))
        }).text();

        const params = new URLSearchParams(response);
        const token = params.get("token") ?? response.split("=")[1];
        if (!token) throw new AuthenticationError(`Unable to fetch client_token: ${response}`);
        return token;
    }

    private async subscribeGcmScope(
        checkin: AndroidCheckinCredentials,
        clientToken: string,
        installationAuthToken: string,
        scope: string
    ): Promise<void> {
        await this.http.ky.post(API_URL.playService.register3, {
            headers: this.gcmHeaders(checkin),
            body: new URLSearchParams(this.gcmForm({
                subtype: clientToken,
                sender: clientToken,
                scope,
                installationAuthToken,
                device: String(checkin.androidId),
                topic: scope
            }))
        });
    }

    private gcmHeaders(checkin: AndroidCheckinCredentials): Record<string, string> {
        return {
            authorization: this.generateAidLogin(checkin),
            app: DC_APP.package,
            gcm_ver: FIREBASE.gcmVersion,
            app_ver: DC_APP.versionCode,
            "User-Agent": "com.google.android.gms/254932038 (Linux; U; Android 16; ko_KR; SM-S928N; Build/BP4A.251205.006; Cronet/144.0.7500.8)"
        };
    }

    private gcmForm(options: {
        subtype: string;
        sender: string;
        scope: string;
        installationAuthToken: string;
        device: string;
        topic?: string;
    }): Record<string, string> {
        return {
            ...(options.topic ? {"X-gcm.topic": options.topic} : {}),
            "X-subtype": options.subtype,
            sender: options.sender,
            "X-app_ver": DC_APP.versionCode,
            "X-osv": FIREBASE.osVersion,
            "X-cliv": FIREBASE.cliv,
            "X-gmsv": FIREBASE.gcmVersion,
            "X-appid": this.fid ?? "",
            "X-scope": options.scope,
            "X-Goog-Firebase-Installations-Auth": options.installationAuthToken,
            "X-gmp_app_id": FIREBASE.appId,
            "X-firebase-app-name-hash": FIREBASE.firebaseAppNameHash,
            "X-app_ver_name": DC_APP.versionName,
            app: DC_APP.package,
            device: options.device,
            app_ver: DC_APP.versionCode,
            info: FIREBASE.info,
            gcm_ver: FIREBASE.gcmVersion,
            plat: "0",
            cert: FIREBASE.cert,
            target_ver: FIREBASE.targetVer
        };
    }

    /** DCInside `app_check` 엔드포인트에서 날짜 토큰을 가져옵니다. */
    private async fetchAppCheckDate(): Promise<string> {
        const json = await this.http.ky.get(API_URL.auth.appCheck, {
            headers: {Host: new URL(API_URL.auth.appCheck).host}
        }).json();
        const object = Array.isArray(json) ? objectValue(arrayValue(json)[0]) : objectValue(json);
        const date = nullableString(object["date"]);
        if (!date) throw new AuthenticationError("app_check date is empty.");
        return date;
    }

    /** `app_id`를 새로 발급받은 직후 서버 검증이 완료될 때까지 대기합니다. */
    private async waitForAppIdVerification(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    private async fetchRemoteConfig(installationAuthToken: string): Promise<unknown> {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
        const korNow = new Date(utc + 9 * 60 * 60 * 1000);
        const firstOpenTime = new Date(korNow.getFullYear(), korNow.getMonth(), korNow.getDate(), 12, 0, 0, 0);

        return this.http.ky.post(API_URL.firebase.remoteConfig, {
            headers: {
                "X-Goog-Api-Key": FIREBASE.apiKey,
                "X-Android-Package": DC_APP.package,
                "X-Android-Cert": FIREBASE.cert,
                "X-Google-GFE-Can-Retry": "yes",
                "X-Goog-Firebase-Installations-Auth": installationAuthToken,
                "X-Firebase-RC-Fetch-Type": "BASE/1",
                "User-Agent": FIREBASE.registerUserAgent
                // "Content-Type": "application/json",
                // Accept: "application/json",
                // "X-Firebase-RC-Fetch-Type": "BASE/1",
                // "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 16; SM-S928N Build/BP4A.251205.006)"
            },
            json: {
                platformVersion: FIREBASE.osVersion,
                appInstanceId: this.fid,
                packageName: DC_APP.package,
                appVersion: DC_APP.versionName,
                countryCode: "KR",
                sdkVersion: FIREBASE.remoteConfigSdkVersion,
                appBuild: DC_APP.versionCode,
                firstOpenTime: firstOpenTime.toISOString(),
                analyticsUserProperties: {
                    "installer_name": "unknown",
                    "store_name": "ONE",
                    "screen_event_ver": "1"
                },
                appId: FIREBASE.appId,
                languageCode: "ko-KR",
                appInstanceIdToken: installationAuthToken,
                timeZone: "GMT"
            }
        }).json();
    }

    private shouldReuseCachedAppId(): boolean {
        if (!this.appIdIssuedAt) return false;
        return Date.now() - this.appIdIssuedAt < APP_ID_TTL_MS;
    }
}

/** `login_quick` 실패 cause가 `login_normal` 재시도 대상인지 확인합니다. */
function shouldRetryNormalLogin(cause: string | null): boolean {
    if (!cause) return false;
    return cause.includes("간편 아이디 삭제") || cause.includes("다시 로그인");
}

/** cause 문자열이 OTP 2차 인증 필요를 의미하는지 확인합니다. */
function isLoginOtpCause(cause: string): boolean {
    return cause.includes("OTP") || cause.includes("otp") || cause.includes("2차");
}

/** cause 문자열이 로그인 캡챠 필요를 의미하는지 확인합니다. */
function isLoginCaptchaCause(cause: string): boolean {
    return cause.includes("자동 입력 방지") || cause.includes("보안코드") || cause.toLowerCase().includes("captcha");
}