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

export interface DCConListResult {
    tabs: DCCon[];
    list: DCCon[][];
}

export interface DCConInfo {
    packageIndex: number;
    mainImage: string;
    title: string;
    description: string;
    mandu: number;
    getState: boolean;
}

export interface DCConDetailResult {
    info: DCConInfo[];
    detail: DCCon[];
}

export interface DCConInsertResult {
    result: boolean;
    newList: string | null;
    imageSource: string | null;
    alternativeText: string | null;
    imageTag: string | null;
    /** 다중 디시콘 삽입 시 각 디테일별 img_tag 목록입니다. 단일 삽입은 빈 배열입니다. */
    imageTags: string[];
}

export interface DCConBuyResult {
    result: number;
    message: string;
}