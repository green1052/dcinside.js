# 시작하기

## 설치

```sh
bun add dcinside.js
```

## 첫 요청

```ts
import {DCInsideClient} from "dcinside.js";

const client = new DCInsideClient();

const list = await client.articles.list({
    galleryType: "mini",
    galleryId: "bjwg64",
});

console.log(list.gallery.title);
console.log(list.articles.length);
```

첫 요청에서는 `client_token`과 `app_id`를 자동 발급합니다. 이후 같은 클라이언트 인스턴스에서는 재사용합니다.

## 게시글 읽기

```ts
const article = await client.articles.read({
    galleryType: "mini",
    galleryId: "bjwg64",
    articleId: 1557,
});

console.log(article.info.subject);
console.log(article.info.views);
console.log(article.main.content);
```

## 세션 설정

글쓰기, 댓글 작성, 추천, 삭제, 관리 기능은 세션이 필요합니다.

```ts
client.useAnonymous("닉네임", "비밀번호");
```

```ts
await client.login("아이디", "비밀번호");
```

```ts
console.log(client.currentUser);
console.log(client.session);
```

## 갤러리 타입

`galleryType`은 갤러리 ID를 어떤 네임스페이스로 보낼지 정합니다.

| 값       | 설명          | 접두사 |
|----------|---------------|--------|
| `main`   | 일반 갤러리   | 없음   |
| `minor`  | 마이너 갤러리 | 없음   |
| `mini`   | 미니 갤러리   | `mi$`  |
| `person` | 인물 갤러리   | `pr$`  |

`mini`와 `person`은 접두사를 자동으로 붙입니다. 이미 접두사가 붙은 ID는 그대로 사용합니다.

## 에러 처리

```ts
import {AuthenticationError, DCInsideError, HTTPError} from "dcinside.js";

try {
    await client.articles.write({
        galleryId: "bjwg64",
        galleryType: "mini",
        subject: "제목",
        content: ["본문"],
    });
} catch (error) {
    if (error instanceof AuthenticationError) {
        console.error("인증 실패", error.message);
    } else if (error instanceof HTTPError) {
        console.error("HTTP 실패", error.statusCode);
    } else if (error instanceof DCInsideError) {
        console.error("API 실패", error.message);
    }
}
```

## 프록시

```ts
const client = new DCInsideClient({
    http: {
        proxy: "http://127.0.0.1:8080",
    },
});
```