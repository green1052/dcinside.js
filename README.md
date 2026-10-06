# dcinside.js

디시인사이드 안드로이드 앱 API를 그대로 쓰는 비공식 클라이언트입니다.
공식 앱 **5.3.6 (100175)** 을 디컴파일해 요청 형식과 응답 모델을 맞췄습니다.

- 앱이 쓰는 엔드포인트 130여 개를 모듈별로 제공합니다.
- 응답 타입 124개는 앱의 Gson 모델에서 생성해서 서버 키 이름과 똑같습니다.
- `client_token`과 `app_id`는 첫 요청 때 자동으로 발급하고, 만료되면 갱신한 뒤 다시 보냅니다.
- 런타임 의존성이 없습니다. Bun과 Node 18+ 내장 `fetch`만 씁니다.

## 설치

```sh
bun add @green-1052/dcinside.js
```

## 빠른 시작

```ts
import {DCInside} from "@green-1052/dcinside.js";

const dc = new DCInside();

const list = await dc.articles.list({gallery: "programming"});
const first = list.gall_list![0]!;

const article = await dc.articles.read("programming", first.no!);
console.log(article.view_info?.subject);
console.log(article.view_main?.memo); // 본문 HTML

const comments = await dc.comments.list("programming", first.no!);
for (const comment of comments.comment_list ?? []) console.log(comment.name, comment.comment_memo);
```

갤러리 ID는 앱과 같습니다. 메인/마이너는 `programming`처럼 그대로, 미니는 `mi$id`, 인물은 `pr$id`로 씁니다.

첫 요청에서는 Google checkin, Firebase, GCM 등록, `app_id` 발급을 차례로 거칩니다. 몇 초 걸리고, 이후에는 캐시를 씁니다.
매번 발급하지 않으려면 인증 정보를 저장해 두세요.

```ts
await Bun.write("device.json", JSON.stringify(dc.auth.exportCredentials()));

const saved = await Bun.file("device.json").json();
const dc2 = new DCInside({credentials: saved});
```

## 세션

글쓰기, 댓글, 추천, 삭제처럼 작성자가 필요한 기능은 세션을 먼저 정해야 합니다.

```ts
// 유동(익명)
dc.useAnonymous("ㅇㅇ", "1234");
await dc.comments.write("programming", 1, "댓글");

// 로그인
await dc.login("아이디", "비밀번호");
await dc.articles.upvote("programming", 1);
```

로그인 세션이 만료되면 저장된 아이디/비밀번호로 다시 로그인하고, 실패한 요청을 한 번 더 보냅니다.

## 글쓰기

```ts
dc.useAnonymous("ㅇㅇ", "1234");

await dc.articles.write({
    gallery: "programming",
    subject: "제목",
    content: [
        "일반 텍스트 블록\n줄바꿈은 그대로 들어갑니다.",
        {type: "image", file: Bun.file("cat.png")},
        {type: "html", html: "<b>굵게</b>"}
    ]
});
```

## 에러

| 에러 | 언제 |
| --- | --- |
| `ApiError` | 서버가 `result: false`와 `cause`를 돌려줬을 때. `error.cause`, `error.response` |
| `CaptchaRequiredError` | 자동입력 방지 코드가 필요할 때 (`ApiError` 하위) |
| `OtpRequiredError` | 로그인에 OTP가 필요할 때 |
| `AuthExpiredError` | `app_id`나 로그인 세션 갱신까지 실패했을 때 |
| `SessionRequiredError` | 세션 없이 작성 기능을 호출했을 때 |
| `HTTPError` | JSON이 아닌 오류 응답 |

캡챠가 나오면 이미지를 띄우고 답을 받아 다시 보냅니다.

```ts
import {CaptchaRequiredError, captchaUrl, newCaptchaKey} from "@green-1052/dcinside.js";

try {
    await dc.articles.upvote("programming", 1);
} catch (error) {
    if (!(error instanceof CaptchaRequiredError)) throw error;
    const key = newCaptchaKey();
    console.log(captchaUrl("recommend", key, "programming"));
    await dc.articles.upvote("programming", 1, {key, code: "사용자가 읽은 글자"});
}
```

## 문서

| 문서 | 내용 |
| --- | --- |
| [시작하기](docs/getting-started.md) | 클라이언트 옵션, 프록시, 인증 흐름, 세션 저장 |
| [게시글](docs/articles.md) | 목록, 읽기, 쓰기, 수정, 삭제, 추천, 투표 |
| [댓글](docs/comments.md) | 목록, 작성, 답글, 디시콘, 보이스 댓글 |
| [갤러리·검색](docs/galleries.md) | 갤러리 정보, 랭킹, 메인, 실베, 통합 검색 |
| [갤로그](docs/gallog.md) | 작성 글/댓글, 스크랩, 방명록 |
| [알림](docs/notifications.md) | 알림함, 구독, 알림 설정 |
| [사용자](docs/user.md) | 내 갤러리, 즐겨찾기, 미니갤 가입, 스크랩 |
| [관리](docs/management.md) | 공지/개념글/말머리, 차단, 관리 내역 |
| [디시콘](docs/dccons.md) | 보유 목록, 상세, 구매, 폴더 |
| [미디어](docs/media.md) | 이미지/동영상/보이스 업로드, 자동짤, AI 이미지 |
| [엔드포인트 목록](docs/endpoints.md) | 메서드별 실제 엔드포인트 |

## 라이선스

GPL-3.0-only
