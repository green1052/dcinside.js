# 갤러리 관리

`client.management`는 마이너/미니 갤러리 관리자 기능을 다룹니다. 모든 메서드는 로그인 세션과 해당 갤러리의 관리자 권한이 필요합니다.

```ts
await client.login("아이디", "비밀번호");
```

## 공지/추천 설정

```ts
await client.management.setNotice({
    galleryId: "programming",
    articleId: 1557,
});

await client.management.setRecommend({
    galleryId: "programming",
    articleId: 1557,
});
```

현재 구현은 DCInside 앱 API의 토글형 관리자 요청을 호출합니다. 응답의 `state`로 서버가 적용한 상태를 확인하세요.

## 말머리 변경

```ts
await client.management.changeHeadText({
    galleryId: "programming",
    articleId: 1557,
    headTextId: 3,
});
```

말머리 ID는 게시글 읽기/수정 정보의 `headTexts`에서 확인할 수 있습니다.

## 유저 차단

```ts
await client.management.blockUser({
    galleryId: "programming",
    articleId: 1557,
    commentId: 12345,
    blockHour: 24,
    category: "spamming",
    reason: "반복 도배",
});
```

`commentId`를 생략하면 게시글 작성자를 기준으로 요청합니다. `category`는 `"obscene"`, `"advertisement"`, `"cussWords"`, `"spamming"`,
`"piracy"`, `"defamation"`, `"custom"` 중 하나입니다.

## 비회원 차단

```ts
await client.management.blockNoMember({
    galleryId: "programming",
    proxyUntil: new Date("2026-07-03T00:00:00+09:00"),
    cellularUntil: new Date("2026-07-03T00:00:00+09:00"),
    image: {
        until: new Date("2026-07-03T00:00:00+09:00"),
        status: "P,M",
    },
});
```

날짜는 내부에서 서울 시간 기준 `yyyy.MM.dd HH:mm` 형식으로 변환됩니다.

## 관리 페이지 링크

```ts
const settingUrl = await client.management.gallerySettingLink("programming");

const blockUrl = await client.management.userBlockLink({
    galleryId: "programming",
    articleId: 1557,
    commentId: 12345,
});
```