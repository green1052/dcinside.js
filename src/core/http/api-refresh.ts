import type {KyInstance} from "ky";
import {apiError, isApiError, shouldRefreshAppId} from "./api-error";
import {firstObject, type JsonObject} from "./json";

/** app_id 갱신 기능만 사용하는 구조 타입입니다. `AuthManager`와 테스트 목업 모두 호환됩니다. */
export interface AppIdRefresher {
    refreshAppId(options?: { refreshClientToken?: boolean }): Promise<unknown>;
}

/** GET 요청을 보낼 수 있는 HTTP 클라이언트 구조 타입입니다. `KyHttpClient`와 호환됩니다. */
interface GetJsonClient {
    ky: KyInstance;
}

/**
 * GET 요청을 보내고 응답의 루트 객체를 반환합니다. 응답이 `refresh_join` API 에러면
 * app_id를 갱신해 같은 URL을 한 번 더 요청합니다. 다른 API 에러는 {@link apiError}로 던집니다.
 */
export async function getJsonWithAppIdRetry(
    http: GetJsonClient,
    auth: AppIdRefresher,
    url: string,
    action: string
): Promise<JsonObject> {
    for (let attempt = 0; ; attempt++) {
        const root = firstObject(await http.ky.get(url).json());
        if (!isApiError(root)) return root;
        if (attempt === 0 && shouldRefreshAppId(root)) {
            await auth.refreshAppId({refreshClientToken: true});
            continue;
        }
        throw apiError(action, root);
    }
}
