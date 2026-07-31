import {type KyHttpClient, postMultipartJson} from "../core/http";
import {API_URL} from "../core/http/constants";
import {booleanValue, nullableString, objectValue, stringValue} from "../core/http/json";
import {dedupeDetailIndices} from "../core/http/utils";
import {requireLoginSession} from "../core/session";
import type {
    DCCon,
    DCConBuyResult,
    DCConDetailResult,
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
        return this.request({type: "list"}) as unknown as DCConListResult;
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
            return {info: [], detail: []};
        }

        return response as unknown as DCConDetailResult;
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
                new_list: null,
                img_src: null,
                alt: null,
                img_tag: null,
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
                new_list: nullableString(response["new_list"]),
                img_src: nullableString(response["img_src"]),
                alt: nullableString(response["alt"]),
                img_tag: imageTag,
                imageTags: imageTag ? [imageTag] : []
            };
        }
        const singles = await Promise.all(detailIndices.map((detailIndex, index) => this.insert({
            packageIndex: resolvePackageIndex(dccon, index, dccon.packageIndex),
            detailIndex
        })));
        const imageTags = singles.map((single) => single.img_tag).filter((tag): tag is string => tag !== null);
        return {
            result: imageTags.length === detailIndices.length,
            new_list: singles.find((single) => single.new_list)?.new_list ?? null,
            img_src: singles.find((single) => single.img_src)?.img_src ?? null,
            alt: singles.find((single) => single.alt)?.alt ?? null,
            img_tag: imageTags[0] ?? null,
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
        return this.request({
            package_idx: dccon.packageIndex ?? 0,
            type: "buy_dccon"
        }) as unknown as DCConBuyResult;
    }

    /** 디시콘 API multipart 요청을 전송하고 객체 응답으로 반환합니다. */
    private async request(multipart: Record<string, string | number | boolean | null | undefined>): Promise<Record<string, unknown>> {
        const response = await postMultipartJson(this.http, API_URL.dccon.dccon, multipart);
        return objectValue(response);
    }

    /** 로그인 세션이 필요한 작업에서 현재 세션을 가져오거나 에러를 던집니다. */
    private requireLogin(action: string): Session {
        return requireLoginSession(this.getSession, action);
    }
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