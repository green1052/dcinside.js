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
    "\"": "&quot;"
};

const HTML_UNESCAPE_MAP: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " "
};

/**
 * HTML 엔티티를 디코딩합니다. named entity와 `&#숫자;` 형태를 모두 처리합니다.
 */
export function decodeHtml(value: string): string {
    return value
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&\w+;/g, (entity) => HTML_UNESCAPE_MAP[entity] ?? entity);
}

/**
 * KotlinInside 호환 HTML 이스케이프.
 * 연속 공백은 &nbsp;로, 줄바꿈은 <br>로, 탭은 &nbsp; ×3으로 변환.
 * 한글 등 non-ASCII 문자는 인코딩하지 않고 그대로 유지.
 */
export function escapeHtml(value: string): string {
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
        else if (char === "\t") output += "&nbsp; &nbsp; &nbsp;";
        else if (HTML_ESCAPE_MAP[char]) output += HTML_ESCAPE_MAP[char];
        else output += char;
    }

    return output;
}
