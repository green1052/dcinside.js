# dcinside.js

디시인사이드 비공식 API 클라이언트

## 설치

```sh
bun add dcinside.js
```

## 빠른 예시

```ts
import {DCInsideClient} from "dcinside.js";

const client = new DCInsideClient();

// 게시글 목록
const list = await client.articles.list({
    galleryType: "mini",
    galleryId: "bjwg64",
});

// 게시글 읽기
const article = await client.articles.read({
    galleryType: "mini",
    galleryId: "bjwg64",
    articleId: list.articles[0]!.id,
});

console.log(article.info.subject);
```

최초 요청 시 자동으로 인증 흐름이 실행됩니다 (약 5-6초 소요). 이후 요청은 캐시된 app_id를 사용하므로 빠릅니다.

## 세션

### 익명

```ts
client.useAnonymous("닉네임", "비밀번호");

await client.comments.write({
    galleryType: "mini",
    galleryId: "bjwg64",
    articleId: 1,
    content: "hello from Bun",
});
```

### 로그인

```ts
await client.login("dcinside-id", "password");

await client.articles.upvote({
    galleryType: "minor",
    galleryId: "bjwg64",
    articleId: 1,
});
```

### 세션 확인

```ts
console.log(client.currentUser);  // User | null
console.log(client.session);      // Session | null
```

## galleryType

`galleryType`은 디시인사이드의 갤러리 네임스페이스를 구분합니다. 생략하면 `"main"`으로 취급합니다.

| 값       | 설명          | 접두사 |
|----------|---------------|--------|
| `main`   | 갤러리        | (없음) |
| `minor`  | 마이너 갤러리 | (없음) |
| `mini`   | 미니 갤러리   | `mi$`  |
| `person` | 인물 갤러리   | `pr$`  |

미니/인물 갤러리는 요청 시 자동으로 접두사가 붙습니다. 접두사가 이미 포함된 ID를 전달해도 중복으로 붙지 않습니다.

## 매니저

| 매니저       | 메서드                                                                                                                    |
|--------------|---------------------------------------------------------------------------------------------------------------------------|
| `articles`   | `list` · `read` · `write` · `delete` · `modifyInfo` · `reportLink` · `upvote` · `downvote` · `hitUpvote`                  |
| `comments`   | `list` · `write` · `reply` · `delete`                                                                                     |
| `dccons`     | `list` · `detail` · `insert` · `buy`                                                                                      |
| `galleries`  | `mainPage` · `minorInfo` · `uploadMovie` · `rankings.main/minor/mini/person`                                              |
| `management` | `setNotice` · `setRecommend` · `changeHeadText` · `blockUser` · `blockNoMember` · `gallerySettingLink` · `userBlockLink`  |
| `search`     | `galleries` · `total`                                                                                                     |
| `user`       | `myGalleries` · `managedGalleries` · `joinedMiniGalleries` · `addFavoriteGallery` · `joinMiniGallery` · `quitMiniGallery` |

자세한 내용은 [docs/](./docs)를 참고하세요.

## 프록시

Bun fetch의 `proxy` 옵션을 지원합니다.

```ts
const client = new DCInsideClient({
    http: {
        proxy: "http://127.0.0.1:8080"
    }
});
```

## 에러 처리

모든 API 에러는 `DCInsideError` (또는 하위 클래스)를 던집니다.

```ts
import {DCInsideError, HTTPError, AuthenticationError} from "dcinside.js";

try {
    await client.articles.write({...});
} catch (e) {
    if (e instanceof AuthenticationError) {
        // 인증 실패
    } else if (e instanceof HTTPError) {
        // HTTP 상태 코드 에러
        console.log(e.statusCode);
    } else if (e instanceof DCInsideError) {
        // API 응답 에러 (cause 포함)
        console.log(e.message);
    }
}
```

## 빌드

```sh
bun run build
```

`bun-plugin-dtsx`를 사용하여 `dist/index.js` (minified)와 `dist/index.d.ts`를 생성합니다.

## 테스트

```sh
bun test
```

단위 테스트는 네트워크 요청 없이 실행되며, 통합 테스트 (`bjwg64.integration.test.ts`)는 실제 DCInside API에 접근합니다.

## Special Thanks

- [KotlinInside](https://github.com/jeongukjae/KotlinInside) — 인증 흐름 설계 참고