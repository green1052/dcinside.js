import {HOST} from "../constants";
import type {Fields, ResponseName} from "../http";
import type {
    AiCharacterPromptResult,
    AiFillPromptsResult,
    AiImageInsertResult,
    AiImageStatus,
    AiPromptListResult,
    AiResampleResult,
    ResponseMap
} from "../types/responses";
import {Api} from "./context";

export interface AiImageOptions {
    gallery: string;
    prompt: string;
    negativePrompt?: string;
    /** `status()`의 샘플링 방식 값입니다. */
    sampling: string;
    /** `status()`의 모델 값입니다. */
    model: string;
    upscale?: boolean;
    /** 캐릭터 참조(이미지 → 이미지) 설정입니다. */
    reference?: { mode: number; filename: string; ext: string; weight?: number };
}

/**
 * AI 이미지 생성(글쓰기 메뉴) API입니다. 로그인이 필요합니다.
 */
export class AiImageApi extends Api {
    /** 사용 가능 모델/샘플러/남은 횟수입니다. (`recom_prompt_new`) */
    async status(): Promise<AiImageStatus> {
        return this.aiPost("AiImageStatus", "recom_prompt_new", {client_id: await this.clientToken()});
    }

    /** 이미지를 생성합니다. (`insert_aiImg`) */
    async generate(options: AiImageOptions): Promise<AiImageInsertResult> {
        const ref = options.reference;
        return this.aiPost("AiImageInsertResult", "insert_aiImg", {
            gallery_id: options.gallery,
            client_id: await this.clientToken(),
            prompt: options.prompt,
            neg_prompt: options.negativePrompt ?? "",
            aiImg_sampling: options.sampling,
            model: options.model,
            upscaler: options.upscale ? "true" : "false",
            chk_tr: ref ? "1" : "0",
            ct_mode: ref?.mode,
            filename: ref?.filename,
            ct_ext: ref?.ext,
            ct_weight: ref ? String(ref.weight ?? 0) : undefined
        });
    }

    /** 저장한 프롬프트 목록입니다. (`prompt_list`) */
    async prompts(): Promise<AiPromptListResult> {
        return this.aiPost("AiPromptListResult", "prompt_list", {});
    }

    /** 프롬프트를 새로 저장하거나(`title`) 덮어씁니다(`idx`). (`save_prompt`) */
    async savePrompt(prompt: { prompt: string; negativePrompt?: string } & ({ title: string } | { idx: number })): Promise<AiPromptListResult> {
        return this.aiPost("AiPromptListResult", "save_prompt", {
            type: "idx" in prompt ? "modify" : "new",
            prompt: prompt.prompt,
            neg_prompt: prompt.negativePrompt ?? "",
            title: "title" in prompt ? prompt.title : undefined,
            idx: "idx" in prompt ? prompt.idx : undefined
        });
    }

    async deletePrompt(idx: number): Promise<AiPromptListResult> {
        return this.aiPost("AiPromptListResult", "del_prompt_list", {idx});
    }

    /** 키워드에 맞는 캐릭터 프롬프트 추천입니다. (`character_prompt`) */
    async characterPrompt(keyword: string): Promise<AiCharacterPromptResult> {
        return this.post("AiCharacterPromptResult", `${HOST.app}/character_prompt`, {confirm_id: this.requireLogin().userId, keyword});
    }

    /** 참조 이미지를 올립니다. (`_app_aiImg_resample_upload.php`) */
    async resample(gallery: string, image: File): Promise<AiResampleResult> {
        return this.post("AiResampleResult", `${HOST.upload}/_app_aiImg_resample_upload.php`, {gall_id: gallery, resample_img_file: image});
    }

    /** 이미지에서 프롬프트를 뽑아냅니다. (`_app_aiImg_fill_prompts.php`) */
    async fillPrompts(image: File): Promise<AiFillPromptsResult> {
        return this.post("AiFillPromptsResult", `${HOST.upload}/_app_aiImg_fill_prompts.php`, {prompt_img: image});
    }

    private aiPost<K extends ResponseName>(as: K, path: string, fields: Fields): Promise<ResponseMap[K]> {
        return this.post(as, `${HOST.app}/${path}`, {user_id: this.requireLogin().userId, ...fields});
    }
}
