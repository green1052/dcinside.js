import {HOST} from "../constants";
import type {Fields} from "../http";
import type {
    AlarmMessageList,
    AlarmSetting,
    AlarmSubscriptions,
    ApiResult,
    ArticleAlarmConfig,
    KeywordAlarmSubscriptions,
    MinorNotificationResponse
} from "../types/responses";
import {indexed} from "../util";
import {Api} from "./context";

/** `I`: 내 글/댓글 알림, `U`: 구독한 글 알림 */
export type AlarmType = "I" | "U";

/** 알림 설정입니다. 각 값은 `1`(켜기)/`0`(끄기)입니다. 생략한 항목은 바꾸지 않습니다. */
export type AlarmSettingUpdate = Partial<Record<
    "use_yn" | "keyword" | "attention" | "recomm" | "activity" | "notify" | "user" | "recomm_article" | "pum" | "img_comment",
    0 | 1
>>;

const ALARM = `${HOST.app}/api/alarm`;

/**
 * 푸시 알림 API입니다. 이 기기(`client_token`) 기준으로 동작하며, 앱처럼 `client_id`로 보냅니다.
 */
export class NotificationApi extends Api {
    /** 알림함 목록입니다. (`alarm/message`) */
    messages(type: AlarmType = "I", page = 1): Promise<AlarmMessageList> {
        return this.get("message", {type, page});
    }

    /** 빈 페이지가 나올 때까지 알림함을 순회합니다. */
    async* messagePages(type: AlarmType = "I", page = 1): AsyncGenerator<AlarmMessageList> {
        for (; ; page++) {
            const result = await this.messages(type, page);
            if (!result.lists?.length) return;
            yield result;
        }
    }

    /** 알림을 지웁니다. `idx`는 `messages()` 항목의 `idx`입니다. (`alarm/del_message`) */
    deleteMessages(idx: string[]): Promise<ApiResult> {
        return this.post("del_message", indexed("del_message", idx));
    }

    /** 알림함을 비웁니다. (`alarm/del_all_message`) */
    deleteAllMessages(): Promise<ApiResult> {
        return this.post("del_all_message", {});
    }

    /** 지운 알림을 되살립니다. `data`는 앱이 저장해 둔 복원 데이터(JSON)입니다. (`alarm/restore`) */
    restoreMessages(data: unknown): Promise<ApiResult> {
        return this.post("restore", {restore_type: "del_restore", restore_data: JSON.stringify(data)});
    }

    /** 알림 설정입니다. (`alarm/setting`) */
    settings(): Promise<AlarmSetting> {
        return this.get("setting", {});
    }

    /** 알림 설정을 바꿉니다. */
    updateSettings(settings: AlarmSettingUpdate): Promise<ApiResult> {
        return this.post("setting", settings);
    }

    /** 특정 글 알림 수신 여부를 바꿉니다. (`alarm/receive`) */
    setReceive(gallery: string, no: number, receive: boolean): Promise<ApiResult> {
        return this.post("receive", {id: gallery, no, receive});
    }

    /** 글의 알림 구독 상태입니다. (`alarm/get_article_config`) */
    articleConfig(gallery: string, no: number, user?: string): Promise<ArticleAlarmConfig> {
        return this.get("get_article_config", {id: gallery, no, user});
    }

    /** 구독 중인 글 목록입니다. (`alarm/article`) */
    articles(options: { gallery?: string; type?: AlarmType } = {}): Promise<AlarmSubscriptions> {
        return this.get("article", {type: options.type, id: options.gallery});
    }

    /** 글 알림을 구독합니다. */
    subscribeArticle(input: { gallery: string; no: number; galleryName: string; nickname: string; subject: string; writeTime?: string }): Promise<ApiResult> {
        return this.post("article", {
            id: input.gallery,
            no: input.no,
            ko_name: input.galleryName,
            nickname: input.nickname,
            subject: input.subject,
            write_time: input.writeTime
        });
    }

    /** 글 알림 구독을 끊습니다. */
    unsubscribeArticle(gallery: string, no: number): Promise<ApiResult> {
        return this.post("del_article", {article_type: "A", type: "U", id: gallery, no});
    }

    /** 구독 중인 이용자 목록입니다. (`alarm/user`) */
    users(gallery?: string): Promise<AlarmSubscriptions> {
        return this.get("user", {id: gallery});
    }

    /** 이용자 새 글 알림을 구독합니다. */
    subscribeUser(input: { gallery: string; galleryName?: string; userId: string; nickname?: string }): Promise<ApiResult> {
        return this.post("user", {id: input.gallery, ko_name: input.galleryName, user_id: input.userId, nickname: input.nickname});
    }

    unsubscribeUser(gallery: string, userId: string): Promise<ApiResult> {
        return this.post("del_user", {id: gallery, user_id: userId});
    }

    /** 키워드 알림 목록입니다. (`alarm/keyword`) */
    keywords(gallery?: string): Promise<KeywordAlarmSubscriptions> {
        return this.get("keyword", {id: gallery});
    }

    subscribeKeyword(gallery: string, keyword: string, galleryName?: string): Promise<ApiResult> {
        return this.post("keyword", {keyword, id: gallery, ko_name: galleryName});
    }

    unsubscribeKeyword(gallery: string, keyword: string, galleryName?: string): Promise<ApiResult> {
        return this.post("del_keyword", {keyword, id: gallery, ko_name: galleryName});
    }

    /** 갤러리의 키워드 알림을 모두 끊습니다. */
    unsubscribeAllKeywords(gallery: string): Promise<ApiResult> {
        return this.post("del_keyword_all", {id: gallery});
    }

    /** 개념글 알림 갤러리 목록입니다. (`alarm/recomm`) */
    recommends(): Promise<AlarmSubscriptions> {
        return this.get("recomm", {});
    }

    subscribeRecommend(gallery: string, galleryName?: string): Promise<ApiResult> {
        return this.post("recomm", {id: gallery, ko_name: galleryName});
    }

    unsubscribeRecommend(gallery: string, galleryName?: string): Promise<ApiResult> {
        return this.post("del_recomm", {id: gallery, ko_name: galleryName});
    }

    /** 공지 알림 갤러리 목록입니다. (`alarm/notify`) */
    notices(): Promise<AlarmSubscriptions> {
        return this.get("notify", {});
    }

    subscribeNotice(gallery: string, galleryName?: string): Promise<ApiResult> {
        return this.post("notify", {id: gallery, ko_name: galleryName});
    }

    unsubscribeNotice(gallery: string, galleryName?: string): Promise<ApiResult> {
        return this.post("del_notify", {id: gallery, ko_name: galleryName});
    }

    /**
     * 댓글 알림을 켭니다. 앱은 `comment_del.php`에 `mode=comment_noti`로 보냅니다. 끄는 API는 없습니다.
     */
    async subscribeComment(gallery: string, no: number, commentNo: number): Promise<ApiResult> {
        return this.http.post(`${HOST.app}/api/comment_del.php`, {
            user_id: this.userId,
            client_token: await this.clientToken(),
            id: gallery,
            no,
            board_id: "",
            mode: "comment_noti",
            best_chk: "N",
            best_comno: 0,
            comment_no: commentNo
        });
    }

    /** 마이너 갤러리 매니저 관련 알림(임명/해임)입니다. (`alarm/minor-notification`) */
    minorNotification(gallery: string): Promise<MinorNotificationResponse> {
        return this.http.post(`${HOST.app}/alarm/minor-notification`, {id: gallery, confirm_id: this.requireLogin().userId});
    }

    /** 마이너 갤러리 알림을 확인 처리합니다. (`alarm/minor-notificationconfirm`) */
    confirmMinorNotification(gallery: string, no: number): Promise<ApiResult> {
        return this.http.post(`${HOST.app}/alarm/minor-notificationconfirm`, {id: gallery, confirm_id: this.requireLogin().userId, no});
    }

    private async get<T>(path: string, query: Fields): Promise<T> {
        return this.http.get(`${ALARM}/${path}`, {client_id: await this.clientToken(), ...query});
    }

    private async post<T>(path: string, fields: Fields): Promise<T> {
        return this.http.post(`${ALARM}/${path}`, {client_id: await this.clientToken(), ...fields});
    }
}
