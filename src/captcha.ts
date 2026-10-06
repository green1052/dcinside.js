import {HOST} from "./constants";
import {toHex} from "./util";

/** 캡챠를 요구하는 상황입니다. */
export type CaptchaKind = "article" | "comment" | "recommend" | "login";

/** 캡챠 이미지 요청에 쓸 임의 키(`dccode`)를 만듭니다. 답을 보낼 때 `CaptchaAnswer.key`로 다시 넘기세요. */
export function newCaptchaKey(): string {
    return toHex(crypto.getRandomValues(new Uint8Array(8)));
}

/** 앱과 같은 캡챠 이미지 주소입니다. `login` 외에는 갤러리 ID가 필요합니다. */
export function captchaUrl(kind: CaptchaKind, key: string, gallery = ""): string {
    const url = kind === "login"
        ? new URL(`${HOST.app}/captcha/code?id=login_botchk&type=L`)
        : new URL(`${HOST.app}/${kind === "article" ? "code.php" : "code_reple.php"}`);
    if (kind === "comment") url.searchParams.set("type", "C");
    if (kind === "recommend") url.searchParams.set("type", "R");
    if (kind !== "login") url.searchParams.set("id", gallery);
    url.searchParams.set("dccode", key);
    return url.toString();
}
