export type JsonObject = Record<string, unknown>;

/** 바이트를 소문자 16진수 문자열로 바꿉니다. */
export function toHex(bytes: ArrayBuffer | Uint8Array): string {
    return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** 앱의 `Jsons.parse`처럼 배열 응답이면 첫 요소를, 숫자 키 객체면 첫 값을 꺼냅니다. */
export function first(value: unknown): JsonObject {
    if (Array.isArray(value)) value = value[0];
    if (!value || typeof value !== "object") return {};
    const object = value as JsonObject;
    const keys = Object.keys(object);
    // 정수 키는 Object.keys가 오름차순으로 돌려줍니다.
    if (keys.length > 0 && keys.every((key) => /^\d+$/.test(key))) return first(object[keys[0]!]);
    return object;
}

/** 배열 응답을 배열로 돌려줍니다. 숫자 키 객체(`{"0": …}`)도 배열로 바꿉니다. */
export function list<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object") return Object.values(value) as T[];
    return [];
}

/** JSON 또는 JSONP(`(...)`) 본문을 파싱합니다. JSON이 아니면 `undefined`입니다. */
export function parseJson(text: string): unknown {
    let body = text.trim();
    if (body.startsWith("(") && body.endsWith(")")) body = body.slice(1, -1);
    try {
        return JSON.parse(body);
    } catch {
        return undefined;
    }
}

/** `result`가 실패를 뜻하는 값인지 확인합니다. `result` 키가 없으면 실패가 아닙니다. */
export function isFailure(object: JsonObject): boolean {
    if (!("result" in object)) return false;
    const result = object["result"];
    return result === false || result === 0 || ["false", "0", "fail", "n", "N"].includes(String(result));
}

/** 캡챠가 필요하다는 뜻의 cause인지 확인합니다. */
export function isCaptchaCause(cause: string): boolean {
    return /captcha|보안\s?코드|자동\s?입력/i.test(cause);
}

/** Java `URLEncoder.encode(value, "UTF-8")`와 같은 결과를 만듭니다(공백은 `+`). */
export function javaUrlEncode(value: string): string {
    return encodeURIComponent(value)
        .replace(/[!'()~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
        .replace(/%20/g, "+");
}

/** 배열을 앱 방식의 인덱스 필드(`name[0]`, `name[1]`…)로 펼칩니다. */
export function indexed<T>(name: string, values: readonly T[] | undefined): Record<string, T> {
    const fields: Record<string, T> = {};
    values?.forEach((value, index) => (fields[`${name}[${index}]`] = value));
    return fields;
}

/** `mi$`/`pr$` 접두사로 갤러리 종류를 판별합니다. 접두사가 없으면 메인/마이너입니다. */
export function galleryKind(gallery: string): "mini" | "person" | "board" {
    if (gallery.startsWith("mi$")) return "mini";
    if (gallery.startsWith("pr$")) return "person";
    return "board";
}

/** `mi$`/`pr$` 접두사를 뗀 갤러리 ID입니다. */
export function stripGalleryPrefix(gallery: string): string {
    return gallery.replace(/^(mi|pr)\$/, "");
}

const NAMED_ENTITIES: Record<string, string> = {amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " "};

/** HTML 엔티티를 풉니다. */
export function decodeHtml(value: string): string {
    return value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, body: string) => {
        if (body[0] !== "#") return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
        const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
        return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    });
}

/** HTML 특수문자를 이스케이프합니다. */
export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (c) => `&${NAMED_ENTITY_OF[c]};`);
}

const NAMED_ENTITY_OF: Record<string, string> = {"&": "amp", "<": "lt", ">": "gt", "\"": "quot", "'": "#39"};

/** 일반 텍스트를 본문 블록 HTML로 바꿉니다. 줄바꿈은 `<br>`, 연속 공백은 `&nbsp;`가 됩니다. */
export function textToHtml(text: string): string {
    return escapeHtml(text).replace(/ {2}/g, " &nbsp;").replace(/\t/g, "&nbsp;".repeat(4)).replace(/\r?\n/g, "<br>");
}
