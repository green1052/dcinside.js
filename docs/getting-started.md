# 시작하기

## 설치

```sh
bun add dcinside.js
```

## 첫 요청

```ts
import {DCInsideClient} from "dcinside.js";

const client = new DCInsideClient();

// 미니 갤러리 게시글 목록
const list = await client.articles.list({
    galleryType: "mini",
    galleryId: "<galleryId>",
    page: 1,
});

console.log(list.gallery.title);    // 갤러리 제목
console.log(list.articles.length);   // 게시글 수
console.log(list.articles[0]);       // 첫 게시글
```

최초 요청 시 자동으로 인증 흐름이 실행됩니다 (약 5-6초 소요). 이후 요청은 캐시된 app_id를 사용하므로 빠릅니다.

## 게시글 읽기

```ts
const article = await client.articles.read({
    galleryType: "mini",
    galleryId: "<galleryId>",
    articleId: 249,
});

console.log(article.info.subject);   // 제목
console.log(article.info.views);     // 조회수
console.log(article.info.userId);    // 작성자 ID
console.log(article.main.content);   // 본문 HTML
console.log(article.main.upvotes);   // 추천수
```

## 세션 설정

세션이 필요한 작업 (글쓰기, 댓글, 추천 등)은 미리 세션을 설정해야 합니다.

### 익명

```ts
client.useAnonymous("닉네임", "비밀번호");
```

### 로그인

```ts
await client.login("아이디", "비밀번호");
```

### 세션 확인

```ts
console.log(client.currentUser);  // User | null
console.log(client.session);      // Session | null
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