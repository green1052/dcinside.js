/** 내 갤러리 목록의 갤러리 항목 원본입니다. */
export interface UserGalleryItem {
    gall_koname: string;
    gall_id: string;
}

/** 내 갤러리/즐겨찾기 응답 원본입니다. */
export interface MyGalleryResult {
    mygall: UserGalleryItem[];
    favori: UserGalleryItem[];
}

/** 관리 중인 갤러리 항목 원본입니다. */
export interface ManagedGallery {
    gall_hide: number;
    gall_id: string;
    gall_koname: string;
    gall_type: string;
    manager_type: string;
}

/** 가입/대기/탈퇴 미니 갤러리 항목 원본입니다. */
export interface JoinedMiniGallery {
    gall_koname: string;
    gall_id: string;
    gall_hide: number;
}

/** 상태별 미니 갤러리 목록 응답 원본입니다. */
export interface JoinedMiniGalleryResult {
    myjoinmini_in: JoinedMiniGallery[];
    myjoinmini_hold: JoinedMiniGallery[];
    myjoinmini_out: JoinedMiniGallery[];
}

/** 즐겨찾기 수정 응답 원본입니다. */
export interface ModifyMyGalleryResult {
    result: boolean;
    cause: string;
}

/** 미니 갤러리 가입 요청 응답 원본입니다. */
export interface MiniGalleryJoinResult {
    result: boolean;
    join_question: string;
}

/** 미니 갤러리 가입 확인 응답 원본입니다. */
export interface MiniGalleryJoinOkResult {
    result: boolean;
    cause: string;
    status: string;
}

/** 미니 갤러리 탈퇴 응답 원본입니다. */
export interface MiniGalleryQuitResult {
    result: boolean;
}