# 시작하기

## 클라이언트 옵션

```ts
import {DCInside} from "@green-1052/dcinside.js";

const dc = new DCInside({
    http: {
        timeout: 30_000,        // 요청 제한 시간(ms)
        proxy: "http://127.0.0.1:8080", // Bun 전용
        headers: {},            // 모든 요청에 덧붙일 헤더
        fetch: customFetch      // 직접 만든 fetch (Node 프록시 등)
    },
    credentials: savedDevice,   // auth.exportCredentials() 결과
    session: savedSession       // dc.session을 저장해 둔 값
});
```

Node에서 프록시를 쓰려면 undici `ProxyAgent`를 붙인 fetch를 넘기세요.

```ts
import {ProxyAgent, fetch as undiciFetch} from "undici";

const agent = new ProxyAgent("http://127.0.0.1:8080");
const dc = new DCInside({
    http: {fetch: ((url, init) => undiciFetch(url, {...init, dispatcher: agent})) as typeof fetch}
});
```

## 인증 흐름

앱과 똑같이 두 가지 값이 필요합니다. 라이브러리가 알아서 발급합니다.

1. **`client_token`** (FCM 토큰): Google checkin, Firebase Installation, GCM `register3` 순서로 받습니다.
2. **`app_id`**: `json2.dcinside.com/json0/app_check_A_rina_one_new.php`의 `date`로
   `SHA-256("dcArdchk_" + date)`를 만들어 `msign.dcinside.com/auth/mobile_app_verification`에 보냅니다.
   앱에서는 이 부분이 네이티브 라이브러리(`libnative-lib.so`) 안에 있습니다.

`app_id`는 앱처럼 11시간 동안 재사용합니다. 서버가 `cause: "certification"`이나 `refresh_join: true`를 돌려주면 새로 발급하고 요청을 한 번 다시 보냅니다.
갓 발급한 `app_id`는 서버에 반영될 때까지 잠깐 거부되므로 발급 직후 5초 기다립니다. `dc.auth.appIdSettleMs`로 바꿀 수 있습니다.

```ts
await dc.auth.appId();                 // 미리 발급
const device = dc.auth.exportCredentials(); // 저장
```

## 세션

```ts
dc.useAnonymous("ㅇㅇ", "1234");          // 유동
const session = await dc.login("id", "pw"); // 로그인
dc.logout();
```

로그인 옵션입니다.

```ts
await dc.login("id", "pw", {
    otp: "123456",        // OTP 6자리
    otpToken: "...",      // 이전 로그인 응답의 otp_token (OTP 생략)
    captcha: {key, code}  // 로그인 캡챠
});
```

`dc.session`은 평범한 객체라서 JSON으로 저장했다가 `new DCInside({session})`로 되살릴 수 있습니다.
요청 중 `cause: "certification_login"`이 오면 저장된 아이디/비밀번호로 `login_quick` 재로그인을 하고 다시 보냅니다.

## 응답 타입

모든 응답 타입은 앱 Gson 모델에서 생성했습니다(`src/types/responses.ts`). 키 이름은 서버 그대로이고, 서버가 상황에 따라 필드를 빼기도 해서 모든 필드가 optional입니다.

```ts
import type {ArticleListResponse, PostItem} from "@green-1052/dcinside.js";
```

서버는 같은 필드를 `"123"`, `123`, `true`처럼 섞어서 보냅니다. 앱은 Gson이 읽으면서 모델 타입으로 바꿔 쓰는데, 이 라이브러리도 같은 규칙으로 응답을 정규화합니다. 그래서 타입에 `number`라고 적힌 값은 실제로도 숫자입니다.

| 모델 타입 | 규칙 |
| --- | --- |
| `string` | 숫자/불리언은 문자열로 (`true` → `"true"`) |
| `int` | 앱 `IntTypeAdapter`처럼 `null`/`""`은 `0`, 불리언은 `1`/`0`, `"12"`는 `12` |
| 그 밖의 숫자 | 숫자 문자열은 숫자로 |
| `boolean` | `"true"`, `"1"`, `"Y"`, `1`은 `true` |

바꿀 수 없는 값(숫자 필드에 `"abc"` 등)은 빠지고, 모델에 없는 키는 그대로 남습니다.
배열로 오는 응답(`[{...}]`)은 앱처럼 첫 객체를 꺼내 돌려줍니다. 목록 응답은 배열 그대로 돌려줍니다.

타입과 스키마는 `scripts/gen-types.ts`로 다시 만들 수 있습니다(jadx로 디컴파일한 APK 소스 필요).

## 저수준 요청

모듈에 없는 엔드포인트도 같은 규칙(app_id 주입, multipart, 만료 재시도)으로 보낼 수 있습니다.

```ts
const result = await dc.http.post("https://app.dcinside.com/api/어딘가", {id: "programming"});
const raw = await dc.http.get(url, query, {raw: true, list: true, appId: false});

// as에 응답 모델 이름을 주면 그 타입으로 정규화해서 돌려줍니다.
const view = await dc.http.get("https://app.dcinside.com/api/gall_view_new.php", {id: "programming", no: 1}, {as: "ArticleViewResponse"});
```
