import crypto from "node:crypto";
import {DC_APP} from "./constants";

export function defaultHeaders(): Record<string, string> {
    return {
        "User-Agent": DC_APP.userAgent,
        Referer: DC_APP.referer,
        "Accept-Encoding": "gzip",
        Connection: "Keep-Alive"
    };
}

export async function sha256Hex(value: string): Promise<string> {
    return crypto.createHash("sha256").update(value).digest("hex");
}

const HTML_ESCAPE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
};

const NAMED_HTML_ENTITIES: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\""
};

/**
 * HTML 특수문자를 이스케이프합니다. `&`, `<`, `>`, `"`, `'`를 엔티티로 변환합니다.
 * DCInside 디시콘 URL/alt 등 attribute 컨텍스트에도 안전하게 사용할 수 있습니다.
 */
export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * HTML 엔티티를 디코딩합니다. named entity(`&amp;` 등), 10진수(`&#39;`), 16진수(`&#x27;`) 형태를 모두 처리합니다.
 * 범위를 벗어난 코드포인트는 원본 엔티티를 그대로 반환합니다.
 */
export function decodeHtml(value: string): string {
    return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g, (entity, body: string) => {
        if (body.startsWith("#x")) return decodeCodePoint(entity, Number.parseInt(body.slice(2), 16));
        if (body.startsWith("#")) return decodeCodePoint(entity, Number.parseInt(body.slice(1), 10));
        return NAMED_HTML_ENTITIES[body] ?? entity;
    });
}

/**
 * HTML 엔티티를 디코딩하고 `<br>` 태그를 줄바꿈(`\n`)으로 변환합니다.
 * 댓글/본문 memo 원문에서 `&lt;br&gt;`, `<br>`, `<br/>`, `<br />` 형태를 모두 처리합니다.
 */
export function decodeMemo(value: string): string {
    return decodeHtml(value).replace(/<br\s*\/?>/gi, "\n");
}

function decodeCodePoint(entity: string, codePoint: number): string {
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return entity;
    try {
        return String.fromCodePoint(codePoint);
    } catch {
        return entity;
    }
}

/**
 * 디테일 인덱스 목록에서 중복과 0 이하 값을 제거한 양수 배열을 반환합니다.
 * `detailIndices`가 비어있으면 `detailIndex`를 사용합니다.
 */
export function dedupeDetailIndices(detailIndices: readonly number[] | undefined, detailIndex?: number): number[] {
    const source = detailIndices && detailIndices.length > 0 ? detailIndices : detailIndex != null ? [detailIndex] : [];
    return [...new Set(source.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
}

/**
 * DCInside 게시글 본문(memo)용 HTML 인코더.
 * 연속 공백은 `&nbsp;`로, 줄바꿈은 `<br>`로, 탭은 `&nbsp;` ×4로 변환합니다.
 * HTML 특수문자도 이스케이프합니다. 한글 등 non-ASCII 문자는 그대로 유지합니다.
 */
export function escapeMemoHtml(value: string): string {
    let previousWasSpace = false;
    let output = "";

    for (const char of value) {
        if (char === " ") {
            if (previousWasSpace) {
                output += "&nbsp;";
                previousWasSpace = false;
                continue;
            }
            previousWasSpace = true;
            output += " ";
            continue;
        }

        previousWasSpace = false;

        if (char === "\n") output += "<br>";
        else if (char === "\t") output += "&nbsp;&nbsp;&nbsp;&nbsp;";
        else if (HTML_ESCAPE_MAP[char]) output += HTML_ESCAPE_MAP[char];
        else output += char;
    }

    return output;
}