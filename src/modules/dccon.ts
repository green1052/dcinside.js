import {type KyHttpClient, postMultipartJson} from "../core/http";
import {API_URL} from "../core/http/constants";
import {
    arrayValue,
    booleanValue,
    nullableString,
    numberValue,
    objectValue,
    stringValue,
    ynBoolean
} from "../core/http/json";
import type {
    DCCon,
    DCConBuyResult,
    DCConDetailResult,
    DCConInfo,
    DCConInsertResult,
    DCConListResult,
    Session
} from "../core/types";

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

    /**
     * 본문에 삽입할 디시콘 태그 정보를 발급받습니다.
     *
     * `detailIndices`에 여러 디테일 인덱스를 전달하면 각 디테일마다 insert API를 호출해
     * `img_tag`를 모아 `imageTags`로 반환합니다. 디테일이 서로 다른 패키지에 속하면
     * `detailPackageIds`로 각 인덱스에 해당하는 패키지를 지정할 수 있습니다.
     *
     * 단일 디테일은 `detailIndex` 하나만 전달하면 됩니다.
     *
     * @param dccon 패키지 인덱스와 디테일 인덱스(목록)입니다.
     * @returns 삽입용 img_tag와 부가 정보입니다. 다중 삽입이면 `imageTags`에 순서대로 들어갑니다.
     */
    async insert(dccon: {
        packageIndex?: number;
        detailIndex?: number;
        detailIndices?: readonly number[];
        detailPackageIds?: readonly string[];
    }): Promise<DCConInsertResult> {
        const detailIndices = dedupeDetailIndices(dccon.detailIndices, dccon.detailIndex);
        if (detailIndices.length === 0) {
            return {
                result: false,
                newList: null,
                imageSource: null,
                alternativeText: null,
                imageTag: null,
                imageTags: []
            };
        }
        if (detailIndices.length === 1) {
            const response = await this.request({
                package_idx: resolvePackageIndex(dccon, 0, dccon.packageIndex),
                detail_idx: detailIndices[0],
                type: "insert"
            });
            const imageTag = nullableString(response["img_tag"]);
            return {
                result: stringValue(response["result"]).toLowerCase() === "ok" || booleanValue(response["result"]),
                newList: nullableString(response["new_list"]),
                imageSource: nullableString(response["img_src"]),
                alternativeText: nullableString(response["alt"]),
                imageTag,
                imageTags: imageTag ? [imageTag] : []
            };
        }
        const imageTags: string[] = [];
        let firstNewList: string | null = null;
        let firstImageSource: string | null = null;
        let firstAlt: string | null = null;
        for (const [index, detailIndex] of detailIndices.entries()) {
            const single = await this.insert({
                packageIndex: resolvePackageIndex(dccon, index, dccon.packageIndex),
                detailIndex: detailIndex
            });
            if (single.imageTag) imageTags.push(single.imageTag);
            if (firstNewList === null && single.newList) firstNewList = single.newList;
            if (firstImageSource === null && single.imageSource) firstImageSource = single.imageSource;
            if (firstAlt === null && single.alternativeText) firstAlt = single.alternativeText;
        }
        return {
            result: imageTags.length === detailIndices.length,
            newList: firstNewList,
            imageSource: firstImageSource,
            alternativeText: firstAlt,
            imageTag: imageTags[0] ?? null,
            imageTags
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

/** 디테일 인덱스 목록에서 중복과 0 이하 값을 제거한 양수 배열을 반환합니다. `detailIndices`가 없으면 `detailIndex`를 사용합니다. */
function dedupeDetailIndices(detailIndices: readonly number[] | undefined, detailIndex?: number): number[] {
    const source = detailIndices && detailIndices.length > 0 ? detailIndices : detailIndex != null ? [detailIndex] : [];
    return [...new Set(source.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
}

/** 다중 삽입 시 인덱스에 해당하는 패키지 식별자를 우선 사용하고, 없으면 기본 packageIndex를 사용합니다. 숫자 문자열만 허용합니다. */
function resolvePackageIndex(
    dccon: { detailPackageIds?: readonly string[]; packageIndex?: number },
    index: number,
    fallback?: number
): number | undefined {
    const explicit = dccon.detailPackageIds?.[index];
    if (explicit && /^\d+$/.test(explicit)) return Number(explicit);
    return fallback;
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