# dcinside.js

디시인사이드 비공식 API 클라이언트

## 설치

Node.js도 지원은 하는데, 번들링이 안 되어 있어서 수정 전까지는 패키지 인식이 안 됩니다.

```sh
bun install github:green1052/dcinside.js
```

## 빠른 시작

```ts
import {DCInsideClient} from "dcinside.js";

const client = new DCInsideClient();

const list = await client.articles.list({
    galleryType: "mini",
    galleryId: "bjwg64",
});

const firstArticle = await client.articles.read({
    galleryType: "mini",
    galleryId: "bjwg64",
    articleId: list.articles[0]!.id,
});

console.log(firstArticle.info.subject);
console.log(firstArticle.main.content);
```

첫 요청에서는 앱 인증에 필요한 `client_token`과 `app_id`를 자동 발급합니다. 이 과정은 몇 초 걸릴 수 있고, 이후 요청은 캐시된 값을 재사용합니다. `app_id`는 공식 앱처럼 약 11시간
동안 로컬 캐시에 자동 저장됩니다.

## 세션

글쓰기, 댓글 작성, 추천, 삭제, 관리 기능은 세션이 필요합니다.

```ts
const client = new DCInsideClient();

client.useAnonymous("닉네임", "비밀번호");

await client.comments.write({
    galleryType: "mini",
    galleryId: "bjwg64",
    articleId: 1,
    content: "댓글 내용",
});
```

```ts
await client.login("dcinside-id", "password");

await client.articles.upvote({
    galleryType: "minor",
    galleryId: "programming",
    articleId: 1,
});
```

현재 세션은 `client.currentUser`와 `client.session`에서 확인할 수 있습니다.

## 게시글 작성

```ts
client.useAnonymous("ㅇㅇ", "password");

const written = await client.articles.write({
    galleryType: "mini",
    galleryId: "bjwg64",
    subject: "제목",
    content: [
        "일반 텍스트",
        {type: "html", html: "<p>HTML 본문</p>"},
    ],
});

console.log(written.articleId);
```

수정은 `mode: "modify"`와 `articleId`를 함께 전달합니다.

```ts
await client.articles.write({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 123,
    mode: "modify",
    subject: "수정된 제목",
    content: ["수정된 본문"],
});
```

DCInside 작성 API가 `잠시후 다시 이용해주세요.`를 반환하면 요청 형식은 통과했지만 서버가 작성을 거절한 상태일 가능성이 큽니다. 너무 짧거나 반복된 제목/본문, 갤러리의 비회원/세션 정책, IP 제한,
짧은 시간 안의 반복 작성이 원인일 수 있습니다.

## galleryType

`galleryType`은 갤러리 네임스페이스를 구분합니다. 생략하면 `"main"`입니다.

| 값       | 설명          | ID 처리                |
|----------|---------------|------------------------|
| `main`   | 일반 갤러리   | 그대로 전송            |
| `minor`  | 마이너 갤러리 | 그대로 전송            |
| `mini`   | 미니 갤러리   | `mi$` 접두사 자동 적용 |
| `person` | 인물 갤러리   | `pr$` 접두사 자동 적용 |

이미 접두사가 붙은 ID를 전달해도 중복으로 붙이지 않습니다.

## 매니저

| 매니저       | 주요 메서드                                                                                                          |
|--------------|----------------------------------------------------------------------------------------------------------------------|
| `articles`   | `list`, `read`, `write`, `delete`, `modifyInfo`, `reportLink`, `upvote`, `downvote`, `hitUpvote`                     |
| `comments`   | `list`, `write`, `reply`, `delete`                                                                                   |
| `dccons`     | `list`, `detail`, `insert`, `buy`                                                                                    |
| `galleries`  | `mainPage`, `minorInfo`, `uploadMovie`, `rankings.main/minor/mini/person`                                            |
| `management` | `setNotice`, `setRecommend`, `changeHeadText`, `blockUser`, `blockNoMember`, `gallerySettingLink`, `userBlockLink`   |
| `search`     | `galleries`, `total`                                                                                                 |
| `user`       | `myGalleries`, `managedGalleries`, `joinedMiniGalleries`, `addFavoriteGallery`, `joinMiniGallery`, `quitMiniGallery` |

자세한 예시는 [docs](./docs)를 참고하세요.

## 프록시

Bun fetch의 `proxy` 옵션을 그대로 전달할 수 있습니다.

```ts
const client = new DCInsideClient({
    http: {
        proxy: "http://127.0.0.1:8080",
    },
});
```

## 에러 처리

API 실패는 `DCInsideError` 또는 하위 에러로 전달됩니다.

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

## 개발

```sh
bun test
bun run build
```

일반 단위 테스트는 네트워크 없이 실행됩니다. `tests/bjwg64.integration.test.ts`는 실제 DCInside API를 호출하며, 작성 테스트는 테스트 글을 생성한 뒤 삭제를 시도합니다.

## Special Thanks

- KotlinInside