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
      │   ├─ 저장된 app_id가 11시간 이내면 즉시 반환
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
| `appId`                | 공식 앱과 동일하게 약 11시간 재사용 | `refreshAppId()`                           |
| `appCheckDate`         | 같은 시(서울 기준) 내에서 재사용    | 시간이 바뀌면 자동 갱신                    |
| `lastHash`             | 같은 프로세스의 중복 발급 방지      | hash가 바뀌면 자동 갱신                    |

공식 앱은 `app_id`를 저장소에 보관한 뒤 일정 시간 재사용합니다. 이 라이브러리도 `app_id`와 발급 시각을 로컬 캐시에 자동 저장하고 약 11시간 동안 재사용합니다.

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
    androidId: "",
    securityToken: "",
});

// Firebase Installation 직접 호출
const installation = await client.auth.fetchFirebaseInstallation();

// checkin 직접 호출
const checkin = await client.auth.fetchAndroidCheckin();

// checkin 기반으로 clientToken 발급
const result = await client.auth.fetchClientTokenWithCheckin(checkin);

// app_id 강제 갱신
await client.auth.refreshAppId({refreshClientToken: true});
```

## 로그인 (OTP / 캡챠)

`client.login(id, password, options)`로 로그인합니다. 2차 인증 (OTP)이 필요한 계정은 `otp`에 번호를 전달합니다.

```ts
await client.login("dcinside-id", "password", {
    otp: "123456",
});
```

서버가 OTP를 요구하면 `LoginOtpRequiredError`가 throw 됩니다. 로그인 캡챠가 필요하면 `LoginCaptchaRequiredError`가 throw 됩니다. 캡챠 답변은 `captcha`
옵션으로 전달합니다.

```ts
await client.login("dcinside-id", "password", {
    captcha: {code: "1234", dccode: "세션식별자"},
});
```

로그인은 기본적으로 `login_quick` 모드로 시도하고, "간편 아이디 삭제"/"다시 로그인" 응답이 오면 `login_normal` 모드로 자동 재시도합니다. `mode` 옵션으로 직접 지정할 수도 있습니다.

## 인증 만료

`app_id`나 로그인 세션이 만료되면 `AuthExpiredError`가 throw 됩니다. `kind`로 만료 종류를 구분합니다.

| `kind`         | cause                 | 처리                            |
|----------------|-----------------------|---------------------------------|
| `appId`        | `certification`       | `app_id` 재발급 후 요청 재시도  |
| `loginSession` | `certification_login` | 로그인 세션 갱신 후 요청 재시도 |

HTTP 클라이언트가 만료 응답을 자동으로 감지해 갱신 후 재시도하므로, 일반적인 사용에서는 직접 처리할 필요가 없습니다. 수동으로 갱신하려면 `client.auth.refreshAppId()` 또는
`client.login(...)`을 다시 호출하세요.