import {type KyHttpClient, postMultipartJson} from "../http";
import {API_URL} from "../http/constants";
import {arrayValue, booleanValue, nullableString, numberValue, objectValue, stringValue, ynBoolean} from "../http/json";
import type {
    DCCon,
    DCConBuyResult,
    DCConDetailResult,
    DCConInfo,
    DCConInsertResult,
    DCConListResult,
    Session
} from "../types";

/**
 * 디시콘 매니저. 디시콘 탭/상세/삽입/구매 흐름을 다룬다.
 */
export class DCConManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly getSession: () => Session | null
    ) {
    }

    /** 디시콘 탭과 목록을 불러온다. */
    async list(): Promise<DCConListResult> {
        const response = await this.request({
            type: "list"
        });

        return {
            tabs: arrayValue(response["tab"]).map(mapDCCon),
            list: arrayValue(response["list"]).map((group) => arrayValue(group).map(mapDCCon))
        };
    }

    /** 패키지 상세 정보를 불러온다. */
    async detail(dccon: Pick<DCCon, "packageIndex">): Promise<DCConDetailResult> {
        const response = await this.request({
            package_idx: dccon.packageIndex ?? 0,
            type: "package_detail"
        });

        if (Array.isArray(response)) {
            return {
                info: [],
                detail: []
            };
        }

        return {
            info: arrayValue(response["info"]).map(mapDCConInfo),
            detail: arrayValue(response["detail"]).map(mapDCCon)
        };
    }

    /** 본문에 삽입할 디시콘 태그 정보를 발급받는다. */
    async insert(dccon: Pick<DCCon, "packageIndex" | "detailIndex">): Promise<DCConInsertResult> {
        const response = await this.request({
            package_idx: dccon.packageIndex ?? 0,
            detail_idx: dccon.detailIndex,
            type: "insert"
        });

        return {
            result: stringValue(response["result"]).toLowerCase() === "ok" || booleanValue(response["result"]),
            newList: nullableString(response["new_list"]),
            imageSource: nullableString(response["img_src"]),
            alternativeText: nullableString(response["alt"]),
            imageTag: nullableString(response["img_tag"])
        };
    }

    /** 디시콘 패키지를 구매한다. 로그인 세션 필요. */
    async buy(dccon: Pick<DCCon, "packageIndex">): Promise<DCConBuyResult> {
        this.requireLogin("buy DCCons");
        const response = await this.request({
            package_idx: dccon.packageIndex ?? 0,
            type: "buy_dccon"
        });

        return {
            result: numberValue(response["result"]),
            message: stringValue(response["msg"])
        };
    }

    /** 디시콘 API multipart 공용 전송. objectValue로 래핑해 반환. */
    private async request(multipart: Record<string, string | number | boolean | null | undefined>): Promise<Record<string, unknown>> {
        const response = await postMultipartJson(this.http, API_URL.dccon.dccon, multipart);
        return objectValue(response);
    }

    /** 로그인 세션이 필요한 작업에서 세션을 가져오거나 에러를 던진다. */
    private requireLogin(action: string): Session {
        const session = this.getSession();
        if (!session?.detail) {
            throw new Error(`A logged-in session is required to ${action}. Call client.login(...).`);
        }
        return session;
    }
}

function mapDCCon(value: unknown): DCCon {
    const object = objectValue(value);
    return {
        packageIndex: numberValue(object["package_idx"]),
        detailIndex: numberValue(object["detail_idx"]),
        title: stringValue(object["title"]),
        imgLink: stringValue(object["img"]),
        memo: stringValue(object["memo"])
    };
}

function mapDCConInfo(value: unknown): DCConInfo {
    const object = objectValue(value);
    return {
        packageIndex: numberValue(object["package_idx"]),
        mainImage: stringValue(object["main_img"]),
        title: stringValue(object["title"]),
        description: stringValue(object["description"]),
        mandu: numberValue(object["mandu"]),
        getState: ynBoolean(object["get_state"])
    };
}