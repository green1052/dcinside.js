import {HOST} from "../constants";
import type {SearchResponse} from "../types/responses";
import {Api} from "./context";

/** 통합 검색 종류입니다. */
export type SearchType =
    | "search_main"
    | "gall_name"
    | "wiki"
    | "gall_content"
    | "movie"
    | "pum_gall"
    /** 자동완성 */
    | "default";

export interface SearchOptions {
    /** 기본 `search_main`(통합)입니다. */
    type?: SearchType;
    page?: number;
    /** 게시글 검색(`gall_content`) 정렬입니다. */
    sort?: "rankup" | "recency";
}

/** 통합 검색입니다. (`_total_search_new.php`) */
export class SearchApi extends Api {
    search(keyword: string, options: SearchOptions = {}): Promise<SearchResponse> {
        return this.http.post(`${HOST.app}/api/_total_search_new.php`, {
            keyword,
            page: options.page,
            confirm_id: this.userId,
            search_type: options.type ?? "search_main",
            content_sort: options.sort
        });
    }
}
