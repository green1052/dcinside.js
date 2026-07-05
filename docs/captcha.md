# 캡챠 (보안코드)

일부 갤러리에서는 글/댓글 작성, 추천, 로그인 시 보안코드 (캡챠)를 요구합니다. dcinside.js는 캡챠 이미지 URL 생성, 다운로드, 답변 전송을 지원합니다.

## 흐름

```
작업 시도 (write/upvote/login)
  │
  ├─ 서버가 캡챠 요구 → CaptchaRequiredError throw
  │   └─ error.challenge: { imageUrl, captcha }
  │
  ├─ 캡챠 이미지 다운로드 → 사용자에게 보여주기
  │   └─ downloadCaptchaImage({ url, outputPath })
  │
  └─ 사용자 입력 코드로 재시도
      └─ captcha: { code, dccode }
```

## 캡챠 에러

서버가 캡챠를 요구하면 `CaptchaRequiredError`가 throw 됩니다. 에러 객체에서 작업 종류와 챌린지 정보를 꺼낼 수 있습니다.

```ts
import {CaptchaRequiredError} from "dcinside.js";

try {
    await gallery.article(1).upvote();
} catch (error) {
    if (error instanceof CaptchaRequiredError) {
        console.log(error.action);       // "voteArticle" | "writeArticle" | "writeComment" | ...
        console.log(error.challenge);    // { imageUrl?, captcha? }
    }
}
```

| `action`       | 설명         |
|----------------|--------------|
| `writeArticle` | 글 작성/수정 |
| `writeComment` | 댓글 작성    |
| `writeReply`   | 답글 작성    |
| `voteArticle`  | 추천/비추천  |
| `login`        | 로그인       |

## 캡챠 챌린지 생성

서버가 이미지 URL을 내려주지 않았거나, 로그인 캡챠 등 미리 챌린지가 필요한 경우 `createCaptchaChallenge`로 생성합니다.

```ts
import {createCaptchaChallenge} from "dcinside.js";

const challenge = createCaptchaChallenge("writeArticle", "mi$bjwg64");
// { imageUrl: "https://app.dcinside.com/code.php?id=mi$bjwg64&dccode=...", captcha: "..." }
```

캡챠 종류는 작업에 따라 자동 선택됩니다.

| 작업         | 캡챠 종류   | 엔드포인트                                 |
|--------------|-------------|--------------------------------------------|
| 글 작성/수정 | `article`   | `app.dcinside.com/code.php`                |
| 댓글/답글    | `comment`   | `app.dcinside.com/code_reple.php`          |
| 추천/비추천  | `recommend` | `app.dcinside.com/code_reple.php` (type=R) |
| 로그인       | `login`     | `app.dcinside.com/captcha/code`            |

## 이미지 다운로드

캡챠 이미지를 다운로드해 바이트 버퍼로 반환합니다. 파일로 저장하려면 호출 측에서 직접 저장하세요.

```ts
import {downloadCaptchaImage} from "dcinside.js";
import {writeFileSync} from "node:fs";

const result = await downloadCaptchaImage({
    url: challenge.imageUrl!,
});
// result.bytes: Buffer
writeFileSync("./captcha.png", result.bytes);
// 사용자에게 captcha.png를 보여주고 코드를 입력받는다
```

## 답변 전송

사용자가 입력한 코드를 `captcha` 옵션으로 전달해 작업을 재시도합니다.

```ts
await gallery.article(1).upvote({
    captcha: {code: "1234", dccode: challenge.captcha},
});
```

글/댓글 작성도 같은 형태입니다.

```ts
await gallery.articles.write({
    subject: "제목",
    content: ["본문"],
    captcha: {code: "1234", dccode: challenge.captcha},
});

await gallery.article(1).comments.write({
    content: "댓글",
    captcha: {code: "1234", dccode: challenge.captcha},
});
```

## 로그인 캡챠

로그인 시 캡챠가 필요하면 `LoginCaptchaRequiredError`가 throw 됩니다. `client.login`의 `captcha` 옵션으로 답변을 전달합니다.

```ts
import {LoginCaptchaRequiredError, createCaptchaChallenge, downloadCaptchaImage} from "dcinside.js";
import {writeFileSync} from "node:fs";

try {
    await client.login("id", "password");
} catch (error) {
    if (error instanceof LoginCaptchaRequiredError) {
        const challenge = createCaptchaChallenge("login");
        const result = await downloadCaptchaImage({url: challenge.imageUrl!});
        writeFileSync("./login-captcha.png", result.bytes);
        // 사용자 입력을 받아 재시도
        await client.login("id", "password", {
            captcha: {code: "1234", dccode: challenge.captcha},
        });
    }
}
```