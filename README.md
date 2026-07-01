# dcinside.js

Bun 기반 디시인사이드 비공식 API 클라이언트. KotlinInside에서 영감을 받았으며 discord.js 스타일의 인터페이스를 제공합니다.

```ts
import {DCInsideClient} from "dcinside.js";

const client = new DCInsideClient();

// 게시글 목록
const list = await client.articles.list({
    galleryType: "mini",
    galleryId: "<galleryId>",
    page: 1,
});

// 게시글 읽기
const article = await client.articles.read({
    galleryType: "mini",
    galleryId: "<galleryId>",
    articleId: list.articles[0]!.id,
});

console.log(article.info.subject);
```

## 세션

### 익명

```ts
client.useAnonymous("닉네임", "비밀번호");

await client.comments.write({
    galleryType: "mini",
    galleryId: "<galleryId>",
    articleId: 1,
    content: "hello from Bun",
});
```

### 로그인

```ts
await client.login("dcinside-id", "password");

await client.articles.upvote({
    galleryType: "minor",
    galleryId: "<galleryId>",
    articleId: 1,
});
```

## galleryType

`galleryType`은 디시인사이드의 갤러리 네임스페이스를 구분합니다. 생략하면 `"main"`으로 취급합니다.

| 값       | 설명          | 접두사 |
|----------|---------------|--------|
| `main`   | 메인 갤러리   | (없음) |
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

## 인증 흐름

클라이언트는 app_id가 필요할 때 자동으로 인증 흐름을 실행합니다.

```
1. Android Checkin (최초 1회, 이후 캐싱)
   └─ POST android.clients.google.com/checkin (protobuf)
   └─ androidId, securityToken 획득

2. Firebase Installation
   └─ POST firebaseinstallations.googleapis.com
   └─ fid, refreshToken, authToken 획득

3. GCM Register3
   └─ POST android.apis.google.com/c2dm/register3
   └─ clientToken 획득

4. GCM Scope 구독 (2개 토픽)

5. Firebase Remote Config

6. App Check
   └─ GET json2.dcinside.com/json0/app_check_A_rina_one_new.php
   └─ date 토큰 획득 → SHA-256 해시

7. App ID 발급
   └─ POST msign.dcinside.com/auth/mobile_app_verification
   └─ app_id 획득
```

최초 발급 후 `clientToken`, `checkinCredentials`, `appCheckDate`, `appId`를 모두 캐싱하여 재사용합니다. 같은 시간대 (서울 기준) 내에서는 app_check 재호출
없이 캐시된 해시를 사용합니다.

### 수동 인증 헬퍼

```ts
const checkin = await client.auth.fetchAndroidCheckin();
const installation = await client.auth.fetchFirebaseInstallation();
await client.auth.fetchClientTokenWithCheckin(checkin);
```

## 검증

```sh
bun run typecheck
bun test
```

통합 테스트 (실제 디시인사이드 API 호출):

```powershell
$env:DCINSIDE_TEST_NICK = "닉네임"
$env:DCINSIDE_TEST_PASSWORD = "비밀번호"
bun test tests/bjwg64.integration.test.ts
```

## 기술 스택

- **런타임**: [Bun](https://bun.sh)
- **HTTP**: [ky](https://github.com/sindresorhus/ky)
- **언어**: TypeScript (strict mode)
- **영감**: [KotlinInside](https://github.com/choiman1559/KotlinInside)

## 프록시

Bun fetch의 `proxy` 옵션을 지원합니다.

```ts
const client = new DCInsideClient({
    http: {
        proxy: "http://127.0.0.1:8080",
    },
});
```