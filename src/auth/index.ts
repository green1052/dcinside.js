import {buildFormData, type KyHttpClient} from "../http";
import {API_URL, DC_APP, FIREBASE} from "../http/constants";
import {AuthenticationError} from "../http/errors";
import {arrayValue, booleanValue, nullableString, numberValue, objectValue, stringValue} from "../http/json";
import {sha256Hex} from "../http/utils";
import type {
    AndroidCheckinCredentials,
    ClientTokenResult,
    FirebaseInstallation,
    Session,
    SessionDetail,
    User
} from "../types";
import {createAndroidCheckinRequest, parseAndroidCheckinResponse} from "./checkin";

const APP_ID_TTL_MS = 39_600_000;
const WRITE_VERIFIED_APP_ID_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * DCInside 앱 인증·세션 관리 매니저.
 * Android checkin → Firebase installation → GCM register3 → app_id 발급 흐름을 캡슐화한다.
 */
export class AuthManager {
    private appId: string | null = null;
    private appIdIssuedAt: number | null = null;
    private appIdWriteVerifiedAt: number | null = null;
    private clientToken: string | null = null;
    private lastHash: string | null = null;
    private fid: string | null = null;
    private refreshToken: string | null = null;
    private appCheckDate: string | null = null;
    private lastAppCheckTime: Date | null = null;
    private checkinCredentials: AndroidCheckinCredentials | null = null;

    constructor(private readonly http: KyHttpClient) {
    }

    /** FCM/GCM 등록으로 얻은 client_token. 아직 발급되지 않았으면 null. */
    get fcmToken(): string | null {
        return this.clientToken;
    }

    /** 현재 Firebase Installation ID (FID). */
    get firebaseInstallationId(): string {
        return this.fid;
    }

    /** Firebase Installation refresh token. 발급 전에는 null. */
    get firebaseRefreshToken(): string | null {
        return this.refreshToken;
    }

    /** checkin 자격증명을 고정값으로 설정한다. 설정하면 프로토콜 checkin을 생략한다. */
    setCheckinCredentials(credentials: { androidId: string; securityToken: string }): void {
        this.checkinCredentials = {
            androidId: BigInt(credentials.androidId),
            securityToken: BigInt(credentials.securityToken)
        };
    }

    /** 외부에서 캡쳐한 app_id를 현재 세션에 주입한다. */
    useAppId(appId: string, options: { writeVerified?: boolean } = {}): void {
        this.appId = appId;
        this.appIdIssuedAt = Date.now();
        this.appIdWriteVerifiedAt = options.writeVerified ? Date.now() : null;
        this.lastHash = null;
    }

    /** app_id가 발급되어 있도록 보장하고 this를 반환한다. */
    async ready(): Promise<this> {
        await this.getAppId();
        return this;
    }

    /** 캐시된 app_id/client_token/checkin을 무효화하고 다시 발급받는다. */
    async refreshAppId(options: { refreshClientToken?: boolean } = {}): Promise<string> {
        this.appId = null;
        this.appIdIssuedAt = null;
        this.appIdWriteVerifiedAt = null;
        this.lastHash = null;
        if (options.refreshClientToken) {
            this.clientToken = null;
            this.checkinCredentials = null;
            this.refreshToken = null;
            this.fid = null;
        }
        return this.getAppId();
    }

    /** 현재 app_id가 글쓰기 서버에서 실제로 통과했음을 기록한다. */
    async markAppIdWriteVerified(): Promise<void> {
        if (!this.appId) return;
        this.appIdWriteVerifiedAt = Date.now();
    }

    /**
     * 캐시된 app_id를 반환하거나 새로 발급받는다.
     * 공식 앱과 동일하게 발급 후 약 11시간 동안 저장된 app_id를 우선 재사용한다.
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
        return this.appId;
    }

    /** DCInside 아이디/비밀번호로 로그인하여 세션을 생성한다. */
    async login(user: Extract<User, { type: "login" }>): Promise<Session> {
        if (!this.clientToken) this.clientToken = await this.fetchClientToken();

        const json = objectValue(await this.http.ky.post(API_URL.auth.login, {
            headers: {
                "User-Agent": DC_APP.userAgent,
                Referer: DC_APP.referer
            },
            body: new URLSearchParams({
                client_token: this.clientToken ?? "",
                mode: "login_normal",
                user_id: user.id,
                user_pw: user.password
            })
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

        if (!detail.result) {
            throw new AuthenticationError(detail.cause ?? "Login failed.");
        }

        return {
            user,
            detail
        };
    }

    /** 익명 세션을 로컬에 생성한다 (네트워크 요청 없음). */
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
     * app_check 날짜 토큰 기반으로 SHA-256 해시 app key를 생성한다.
     * 같은 시(서울 기준) 내에서는 app_check 재호출 없이 캐시된 날짜 토큰을 재사용.
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

    /** Firebase Installations API로 FID/refreshToken/authToken을 발급받는다. */
    async fetchFirebaseInstallation(options: {
        fid?: string;
        refreshToken?: string
    } = {}): Promise<FirebaseInstallation> {
        const body: Record<string, string> = {
            appId: FIREBASE.appId,
            authVersion: FIREBASE.authVersion,
            sdkVersion: FIREBASE.sdkVersion
        };

        if (options.fid ?? this.fid) body["fid"] = options.fid ?? this.fid;
        if (options.refreshToken ?? this.refreshToken) body["refreshToken"] = options.refreshToken ?? this.refreshToken!;

        const json = objectValue(await this.http.ky.post(API_URL.firebase.installations, {
            headers: {
                "X-Android-Package": DC_APP.package,
                "X-Android-Cert": FIREBASE.cert,
                "x-firebase-client": FIREBASE.firebaseClient,
                "x-goog-api-key": FIREBASE.apiKey
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

    /** checkin → Firebase → GCM 전체 흐름을 실행해 client_token을 발급받는다. */
    async fetchClientToken(): Promise<string> {
        if (this.clientToken) return this.clientToken;

        if (!this.checkinCredentials) this.checkinCredentials = await this.fetchAndroidCheckin();
        const result = await this.fetchClientTokenWithCheckin(this.checkinCredentials);
        return result.clientToken;
    }

    /** Google Android checkin 프로토콜로 androidId/securityToken을 발급받는다. 최초 1회만 호출. */
    async fetchAndroidCheckin(): Promise<AndroidCheckinCredentials> {
        if (this.checkinCredentials) return this.checkinCredentials;
        const response = await this.http.ky.post(API_URL.playService.checkin, {
            headers: {"content-type": "application/x-protobuf"},
            body: createAndroidCheckinRequest()
        }).arrayBuffer();
        this.checkinCredentials = parseAndroidCheckinResponse(new Uint8Array(response));
        return this.checkinCredentials;
    }

    /** 이미 받은 checkin 자격증명으로 client_token 발급 흐름을 실행한다. */
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

    /** GCM Authorization 헤더용 AidLogin 토큰 문자열을 만든다. */
    generateAidLogin(checkin: AndroidCheckinCredentials): string {
        return `AidLogin ${checkin.androidId}:${checkin.securityToken}`;
    }

    /** app_id를 서버에서 발급받는다. */
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

        console.log(body);

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

    /** 이전 app_check 시간과 현재 시간이 다른 년/월/일/시인지 확인 (서울 기준). */
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
        console.log(clientToken);

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
                    "installer_name": "com.google.android.packageinstaller",
                    "store_name": "ONE",
                    "screen_event_ver": "1"
                },
                appId: FIREBASE.appId,
                languageCode: "ko-KR",
                appInstanceIdToken: installationAuthToken,
                timeZone: "Asia/Seoul"
            }
        }).json();
    }

    private gcmHeaders(checkin: AndroidCheckinCredentials): Record<string, string> {
        return {
            authorization: this.generateAidLogin(checkin),
            app: DC_APP.package,
            gcm_ver: FIREBASE.gcmVersion,
            app_ver: DC_APP.versionCode,
            "User-Agent": "com.google.android.gms/254932038 (Linux; U; Android 16; ko_KR; sdk_gphone64_x86_64; Build/BE4B.251210.005; Cronet/144.0.7500.8)"
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
            "X-appid": this.fid,
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

    /** DCInside app_check 엔드포인트에서 날짜 토큰을 가져온다. */
    private async fetchAppCheckDate(): Promise<string> {
        const json = await this.http.ky.get(API_URL.auth.appCheck, {
            headers: {Host: new URL(API_URL.auth.appCheck).host}
        }).json();
        const object = Array.isArray(json) ? objectValue(arrayValue(json)[0]) : objectValue(json);
        const date = nullableString(object["date"]);
        if (!date) throw new AuthenticationError("app_check date is empty.");
        return date;
    }

    private shouldReuseCachedAppId(): boolean {
        if (!this.appIdIssuedAt) return false;
        return isReusableCachedAppId(this.appIdIssuedAt, this.appIdWriteVerifiedAt);
    }
}

function isReusableCachedAppId(issuedAt: number, writeVerifiedAt: number | null): boolean {
    const now = Date.now();
    return now - issuedAt < APP_ID_TTL_MS
        || (writeVerifiedAt != null && now - writeVerifiedAt < WRITE_VERIFIED_APP_ID_TTL_MS);
}