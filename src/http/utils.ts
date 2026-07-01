import {DC_APP} from "./constants";

export function defaultHeaders(): Record<string, string> {
    return {
        "User-Agent": DC_APP.userAgent,
        Referer: DC_APP.referer,
        Connection: "Keep-Alive"
    };
}

export async function sha256Hex(value: string): Promise<string> {
    const hash = new Bun.CryptoHasher("sha256");
    hash.update(value);
    return hash.digest("hex");
}

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
        } else {
            previousWasSpace = false;
        }

        if (char === "<") output += "&lt;";
        else if (char === ">") output += "&gt;";
        else if (char === "&") output += "&amp;";
        else if (char === "\"") output += "&quot;";
        else if (char === "\n") output += "<br>";
        else if (char === "\t") output += "&nbsp; &nbsp; &nbsp;";
        else output += char;
    }

    return output;
}