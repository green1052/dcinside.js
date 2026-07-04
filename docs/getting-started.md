# 시작하기

## 설치

Node.js도 지원은 하는데, 번들링이 안 되어 있어서 수정 전까지는 패키지 인식이 안 됩니다.

```sh
bun install github:green1052/dcinside.js
```

## 첫 요청

```ts
import {DCInsideClient} from "dcinside.js";

const client = new DCInsideClient();
const gallery = client.gallery("mi$bjwg64");

const list = await gallery.articles.list();

console.log(list.gallery.title);
console.log(list.articles.length);
```

첫 요청에서는 `client_token`과 `app_id`를 자동 발급합니다. 이후 같은 클라이언트 인스턴스에서는 재사용합니다.

## 게시글 읽기

```ts
const article = await gallery.article(1557).read();

console.log(article.info.subject);
console.log(article.info.views);
console.log(article.main.content);
```

`client.gallery(...)`에는 `football_new9`, `krstock`, `mi$bjwg64`, `pr$dororong`처럼 하나의 식별자만 넘기면 됩니다. 목록/작성은
`gallery.articles.*`, 읽기/댓글은 `gallery.article(id).*`로 내려가면 됩니다.

## 세션 설정

글쓰기, 댓글 작성, 추천, 삭제, 관리 기능은 세션이 필요합니다.

```ts
client.useAnonymous("닉네임", "비밀번호");
```

```ts
await client.login("아이디", "비밀번호");

// 2차 인증(OTP)이 필요한 계정
await client.login("아이디", "비밀번호", {otp: "123456"});
```

```ts
console.log(client.currentUser);
console.log(client.session);
```

## 에러 처리

```ts
import {
    AuthExpiredError,
    AuthenticationError,
    CaptchaRequiredError,
    DCInsideError,
    HTTPError,
    LoginOtpRequiredError
} from "dcinside.js";

try {
    await client.gallery("mi$bjwg64").articles.write({
        subject: "제목",
        content: ["본문"],
    });
} catch (error) {
    if (error instanceof CaptchaRequiredError) {
        console.error("캡챠 필요", error.action, error.challenge);
    } else if (error instanceof AuthExpiredError) {
        console.error("인증 만료", error.kind);
    } else if (error instanceof LoginOtpRequiredError) {
        console.error("OTP 필요");
    } else if (error instanceof AuthenticationError) {
        console.error("인증 실패", error.message);
    } else if (error instanceof HTTPError) {
        console.error("HTTP 실패", error.statusCode);
    } else if (error instanceof DCInsideError) {
        console.error("API 실패", error.message);
    }
}
```

캡챠 처리와 인증 만료 자동 갱신에 대한 자세한 내용은 [캡챠](./captcha.md)와 [인증](./authentication.md) 문서를 참고하세요.

## 프록시

```ts
const client = new DCInsideClient({
    http: {
        proxy: "http://127.0.0.1:8080",
    },
});
```