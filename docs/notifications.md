# 알림

`client.notifications`는 알림 (알람) 조회, 게시글/이용자/키워드/개념글/공지 알림 등록·해제를 담당합니다. 모든 요청에는 디바이스 인증 (`app_id`, `client_token`/
`client_id`)이 필요하며 `DCInsideClient`가 자동으로 주입합니다.

## 알림 (알람) 목록

```ts
const result = await client.notifications.listAlarms({page: 1});

for (const alarm of result.items) {
    console.log(alarm.galleryId, alarm.postNo, alarm.title, alarm.body);
}
```

`AlarmItem`은 알림 종류, 갤러리 정보, 게시글/댓글 번호, 작성자 정보, 제목/본문, 생성 시각, 읽음 여부를 포함합니다.

## 게시글 알림

게시글에 댓글/답글이 달리면 알림을 받습니다.

```ts
await client.notifications.toggleArticle({
    galleryId: "programming",
    postNo: "12345",
    enable: true,
    galleryName: "프로그래밍",
    nickname: "작성자",
    subject: "게시글 제목",
});

// 해제
await client.notifications.toggleArticle({
    galleryId: "programming",
    postNo: "12345",
    enable: false,
});
```

게시글 알림 구독 목록을 조회합니다.

```ts
const result = await client.notifications.listArticleSubscriptions({type: "U"});
console.log(result.subscriptions);
```

## 이용자 구독 알림

특정 작성자가 새 글을 올리면 알림을 받습니다.

```ts
await client.notifications.toggleUser({
    enable: true,
    galleryId: "programming",
    galleryName: "프로그래밍",
    writerUserId: "writer-1",
    nickname: "작성자",
});

// 해제
await client.notifications.toggleUser({
    enable: false,
    galleryId: "programming",
    writerUserId: "writer-1",
});
```

이용자 구독 목록을 조회합니다.

```ts
const result = await client.notifications.listUserSubscriptions();
console.log(result.subscriptions);
```

## 키워드 알림

갤러리에서 특정 키워드가 포함된 글이 올라오면 알림을 받습니다.

```ts
await client.notifications.toggleKeyword({
    enable: true,
    galleryId: "programming",
    galleryName: "프로그래밍",
    keyword: "TypeScript",
});

// 단일 키워드 해제
await client.notifications.toggleKeyword({
    enable: false,
    galleryId: "programming",
    keyword: "TypeScript",
});

// 갤러리의 모든 키워드 알림 해제
await client.notifications.deleteAllKeywords({galleryId: "programming"});
```

키워드 알림 목록을 조회합니다.

```ts
const result = await client.notifications.listKeywordNotifications();
console.log(result.subscriptions);
```

## 개념글 알림

갤러리에 개념글이 올라오면 알림을 받습니다.

```ts
await client.notifications.toggleRecommend({
    enable: true,
    galleryId: "programming",
    galleryName: "프로그래밍",
});

// 해제
await client.notifications.toggleRecommend({
    enable: false,
    galleryId: "programming",
});
```

개념글 알림 구독 목록을 조회합니다.

```ts
const result = await client.notifications.listRecommendNotifications();
console.log(result.subscriptions);
```

## 공지 알림

갤러리에 공지가 올라오면 알림을 받습니다.

```ts
await client.notifications.toggleNotice({
    enable: true,
    galleryId: "programming",
    galleryName: "프로그래밍",
});

// 해제
await client.notifications.toggleNotice({
    enable: false,
    galleryId: "programming",
});
```

공지 알림 구독 목록을 조회합니다.

```ts
const result = await client.notifications.listNoticeNotifications();
console.log(result.subscriptions);
```

## 댓글 알림

게시글에 새 댓글이 달리면 알림을 받습니다. 댓글 알림 해제는 댓글 삭제와 동일한 엔드포인트를 사용하므로 지원하지 않습니다.

```ts
await client.notifications.toggleComment({
    galleryId: "programming",
    postNo: "12345",
    commentNo: "12",
    enable: true,
});
```

## 마이너 갤러리 알림

마이너 갤러리 알림 등록과 확인을 지원합니다.

```ts
await client.notifications.minorNotification({galleryId: "mi$bjwg64", postNo: "1"});
await client.notifications.confirmMinorNotification({galleryId: "mi$bjwg64", postNo: "1"});
```