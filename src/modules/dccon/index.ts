import {type KyHttpClient, postMultipartJson} from "../../core/http";
import {API_URL} from "../../core/http/constants";
import {
    arrayValue,
    booleanValue,
    nullableString,
    numberValue,
    objectValue,
    stringValue,
    ynBoolean
} from "../../core/http/json";
import type {
    DCCon,
    DCConBuyResult,
    DCConDetailResult,
    DCConInfo,
    DCConInsertResult,
    DCConListResult,
    Session
} from "../../core/types";

/**
 * 디시콘 탭, 상세 정보, 본문 삽입, 구매 흐름을 처리합니다.
 */
export class DCConManager {
    constructor(
        private readonly http: KyHttpClient,
        private readonly getSession: () => Session | null
    ) {
    }

    /**
     * 디시콘 탭과 탭별 디시콘 목록을 불러옵니다.
     *
     * @returns 탭 목록과 각 탭의 디시콘 목록입니다.
     */
    async list(): Promise<DCConListResult> {
        const response = await this.request({
            type: "list"
        });

        return {
            tabs: arrayValue(response["tab"]).map(mapDCCon),
            list: arrayValue(response["list"]).map((group) => arrayValue(group).map(mapDCCon))
        };
    }

    /**
     * 디시콘 패키지 상세 정보를 불러옵니다.
     *
     * @param dccon 조회할 패키지 인덱스입니다. 생략하면 `0`을 사용합니다.
     * @returns 패키지 정보와 상세 디시콘 목록입니다.
     */
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

    /**
     * 디시콘 패키지를 구매합니다.
     *
     * @param dccon 구매할 패키지 인덱스입니다.
     * @returns 서버가 반환한 구매 결과와 메시지입니다.
     */
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

    /** 디시콘 API multipart 요청을 전송하고 객체 응답으로 반환합니다. */
    private async request(multipart: Record<string, string | number | boolean | null | undefined>): Promise<Record<string, unknown>> {
        const response = await postMultipartJson(this.http, API_URL.dccon.dccon, multipart);
        return objectValue(response);
    }

    /** 로그인 세션이 필요한 작업에서 현재 세션을 가져오거나 에러를 던집니다. */
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