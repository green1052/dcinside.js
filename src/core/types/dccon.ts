/** 디시콘 입력 식별자입니다. `detail()`/`buy()`/`insert()` 입력에 사용됩니다. */
export interface DCCon {
    packageIndex?: number;
    detailIndex: number;
    /** 다중 디시콘 삽입 시 사용할 상세 인덱스 목록입니다. 단일 디시콘은 `detailIndex`를 사용합니다. */
    detailIndices?: readonly number[];
    /** 디시콘 패키지 식별자입니다. 다중 삽입 시 각 디테일의 패키지를 개별 지정할 때 사용합니다. */
    packageId?: string;
    /** 다중 디시콘 삽입 시 각 디테일별 패키지 식별자 목록입니다. */
    detailPackageIds?: readonly string[];
    imgLink?: string;
    memo?: string;
    title?: string;
    type?: string | null;
}

/** 디시콘 목록/상세 항목 원본입니다. */
export interface DCConListItem {
    package_idx: number;
    detail_idx: number;
    title: string;
    img: string;
    memo: string;
}

/** 디시콘 패키지 정보 원본입니다. */
export interface DCConInfo {
    package_idx: number;
    main_img: string;
    title: string;
    description: string;
    mandu: number;
    get_state: string;
}

/** 디시콘 탭/목록 응답 원본입니다. */
export interface DCConListResult {
    tab: DCConListItem[];
    list: DCConListItem[][];
}

/** 디시콘 패키지 상세 응답 원본입니다. */
export interface DCConDetailResult {
    info: DCConInfo[];
    detail: DCConListItem[];
}

/**
 * 디시콘 본문 삽입 응답 원본입니다. `imageTags`는 다중 삽입 시 클라이언트가
 * 각 디테일의 `img_tag`를 모아 만든 배열입니다.
 */
export interface DCConInsertResult {
    result: boolean;
    new_list: string | null;
    img_src: string | null;
    alt: string | null;
    img_tag: string | null;
    /** 다중 디시콘 삽입 시 각 디테일별 img_tag 목록입니다. 단일 삽입은 빈 배열입니다. */
    imageTags: string[];
}

/** 디시콘 구매 응답 원본입니다. */
export interface DCConBuyResult {
    result: number;
    msg: string;
}