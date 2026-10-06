import {HOST} from "../constants";
import type {AppCheck, AppNotice, AppUpdateNotice} from "../types/responses";
import {Api} from "./context";

/** 앱 공통 정보(점검/업데이트/공지)입니다. 인증 없이 호출합니다. */
export class AppApi extends Api {
    /** 서버 점검 여부와 `app_id` 발급용 날짜 토큰입니다. (`app_check_A_rina_one_new.php`) */
    async check(): Promise<AppCheck> {
        return this.get("AppCheck", `${HOST.json2}/json0/app_check_A_rina_one_new.php`, {}, {appId: false});
    }

    /** 업데이트 안내입니다. (`update_notice_A_rina_one_new.php`) */
    async updateNotice(): Promise<AppUpdateNotice> {
        return this.get("AppUpdateNotice", `${HOST.json2}/json0/update_notice_A_rina_one_new.php`, {}, {appId: false});
    }

    /** 앱 공지입니다. (`app_dc_notice_one_new.php`) */
    async notice(): Promise<AppNotice> {
        return this.get("AppNotice", `${HOST.json2}/json0/app_dc_notice_one_new.php`, {}, {appId: false});
    }
}
