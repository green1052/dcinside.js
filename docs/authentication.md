# 인증

dcinside.js는 디시인사이드 앱의 인증 흐름을 자동으로 처리합니다. 사용자가 직접 인증 코드를 작성할 필요는 없지만, 동작 방식을 이해하면 문제 해결에 도움이 됩니다.

## 전체 흐름

```
new DCInsideClient()
  │
  ├─ KyHttpClient 생성
  │   ├─ beforeRequest 훅: injectDCInsideContext (app_id, user_id, client_token 주입)
  │   └─ beforeRequest 훅: redirectAppApiGet (app API GET → redirect.php)
  │
  ├─ AuthManager 생성 (checkinCredentials = null)
  │
  └─ client.login(id, pw) 또는 첫 API 호출
      │
      ├─ fetchClientToken()  [최초 1회, 이후 캐싱]
      │   ├─ fetchAndroidCheckin()
      │   │   └─ POST android.clients.google.com/checkin (protobuf)
      │   │   └─ → androidId, securityToken (캐싱)
      │   ├─ fetchFirebaseInstallation()
      │   │   └─ POST firebaseinstallations.googleapis.com
      │   │   └─ → fid, refreshToken, authToken
      │   ├─ registerGcm()
      │   │   └─ POST android.apis.google.com/c2dm/register3
      │   │   └─ → clientToken
      │   ├─ subscribeGcmScope() × 2
      │   │   └─ DcRefreshRemoteConfig, DcShowNoticeMessage 토픽 구독
      │   ├─ fetchRemoteConfig()
      │   │   └─ POST firebaseremoteconfig.googleapis.com
      │   └─ clientToken 캐싱
      │
      ├─ getAppId()  [필요 시에만]
      │   ├─ generateHashedAppKey()
      │   │   ├─ needsAppCheckRefresh() → 같은 시간대면 캐시 재사용
      │   │   ├─ fetchAppCheckDate()
      │   │   │   └─ GET json2.dcinside.com/json0/app_check_A_rina_one_new.php
      │   │   └─ sha256("dcArdchk_" + date)
      │   ├─ hash === lastHash && appId → 캐시 반환
      │   └─ fetchAppId()
      │       └─ POST msign.dcinside.com/auth/mobile_app_verification
      │           └─ → app_id (캐싱)
      │
      └─ login (세션 생성 시에만)
          └─ POST msign.dcinside.com/api/login
              └─ → SessionDetail (userId, name, sessionType 등)
```

## 캐싱 구조

| 항목                   | 캐시 조건                           | 갱신 방법                                  |
|------------------------|-------------------------------------|--------------------------------------------|
| `checkinCredentials`   | 최초 1회 발급 후 영구 캐싱          | `refreshAppId({refreshClientToken: true})` |
| `clientToken`          | 발급 후 영구 캐싱                   | `refreshAppId({refreshClientToken: true})` |
| `fid` / `refreshToken` | clientToken 갱신 시마다 새 fid 생성 | 자동                                       |
| `appCheckDate`         | 같은 시(서울 기준) 내에서 재사용    | 시간이 바뀌면 자동 갱신                    |
| `lastHash` / `appId`   | hash가 같으면 재사용                | hash가 바뀌면 자동 재발급                  |

## HTTP 훅

### injectDCInsideContext

`app.dcinside.com`, `upload.dcinside.com`, `m4up4.dcinside.com`, `m.dcinside.com` 호스트로 향하는 요청에 자동으로 인증 필드를 주입합니다.

- **GET**: `app_id`, `confirm_id` (로그인 시)를 query string에 추가
- **POST (multipart)**: `app_id`, `user_id`, `client_token`을 FormData에 추가
- **POST (urlencoded)**: `app_id`, `user_id`, `client_token`을 body에 추가

이미 해당 필드가 있으면 덮어쓰지 않습니다.

### redirectAppApiGet

`app.dcinside.com/api/*` 경로의 GET 요청을 `redirect.php?hash=base64(원본URL)`로 리다이렉트합니다. 디시인사이드 앱 API가 직접 GET을 허용하지 않고 redirect
경유를 요구하기 때문입니다.

## 수동 API

```ts
// checkin 자격증명 수동 설정 (프로토콜 checkin 생략)
client.auth.setCheckinCredentials({
  androidId: "3816187042652070764",
  securityToken: "3588619422980947403",
});

// Firebase Installation 직접 호출
const installation = await client.auth.fetchFirebaseInstallation();

// checkin 직접 호출
const checkin = await client.auth.fetchAndroidCheckin();

// checkin 기반으로 clientToken 발급
const result = await client.auth.fetchClientTokenWithCheckin(checkin);

// app_id 강제 갱신
await client.auth.refreshAppId({ refreshClientToken: true });
```