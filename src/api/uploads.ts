import {HOST} from "../constants";
import type {ApiResult, AutoImageUploadResult, VideoInfoResult, VideoUploadResult, VoiceDownloadResult} from "../types/responses";
import {javaUrlEncode} from "../util";
import {Api} from "./context";

export interface MovieInfo {
    gallery: string;
    allowDownload?: boolean;
    description?: string;
    tags?: string;
}

/**
 * 이미지/동영상/보이스 업로드입니다.
 */
export class UploadApi extends Api {
    /** 이미지를 미리 올립니다(자동짤 등에서 씀). (`upload_img_auto.php`) */
    async images(files: Blob[]): Promise<AutoImageUploadResult> {
        const fields: Record<string, Blob | string | undefined> = {confirm_id: this.userId, client_id: await this.clientToken()};
        files.forEach((file, index) => (fields[`upload[${index}]`] = file));
        return this.post("AutoImageUploadResult", `${HOST.upload}/upload_img_auto.php`, fields);
    }

    /** 동영상을 올립니다. 결과로 `movieInfo()`를 등록하세요. (`m4up4.dcinside.com/movie_upload_v1.php`) */
    async movie(gallery: string, file: Blob): Promise<VideoUploadResult> {
        return this.post("VideoUploadResult", `${HOST.movie}/movie_upload_v1.php`, {id: gallery, thum_count: "1", avatar: file}, {appId: false});
    }

    /** 올린 동영상의 정보를 등록합니다. (`movie/insert-mvinfo`) */
    async movieInfo(info: MovieInfo & { thumbnail: string; width: number; height: number }): Promise<VideoInfoResult> {
        return this.post("VideoInfoResult", `${HOST.app}/movie/insert-mvinfo`, {
            confirm_id: this.userId,
            id: info.gallery,
            mv_allow_down: info.allowDownload ?? false,
            mv_thumb: info.thumbnail,
            mv_width: info.width,
            mv_height: info.height,
            mv_desc: info.description,
            mv_tag: info.tags
        });
    }

    /** 등록한 동영상 정보를 고칩니다. (`movie/modify-mvinfo`) */
    async modifyMovieInfo(info: MovieInfo & { token: string; movieNo: string }): Promise<VideoInfoResult> {
        return this.post("VideoInfoResult", `${HOST.app}/movie/modify-mvinfo`, {
            confirm_id: this.userId,
            id: info.gallery,
            mv_token: info.token,
            mv_no: info.movieNo,
            mv_allow_down: info.allowDownload ?? false,
            mv_desc: info.description,
            mv_tag: info.tags
        });
    }

    /** 보이스 리플(음성 게시물)을 올립니다. 익명이면 `name`이 닉네임입니다. (`_app_vr_board.php`) */
    async voice(gallery: string, file: File, options: { name?: string; downloadable?: boolean } = {}): Promise<ApiResult> {
        return this.post("ApiResult", `${HOST.upload}/_app_vr_board.php`, {
            gall_id: gallery,
            upfile: file,
            ...(this.userId ? {user_id: this.userId} : {name: options.name ? javaUrlEncode(options.name) : undefined}),
            down_chk: options.downloadable ?? false
        });
    }

    /** 보이스 파일 주소를 받습니다. `vr`은 본문 속 보이스 키입니다. (`m.dcinside.com/voice/download`) */
    async voiceDownload(vr: string): Promise<VoiceDownloadResult> {
        return this.post("VoiceDownloadResult", `${HOST.mobile}/voice/download`, {vr}, {appId: false});
    }
}
