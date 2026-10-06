# 알림 `dc.notifications`

알림은 기기(`client_token`) 단위입니다. 앱처럼 `client_id`라는 이름으로 보냅니다.
같은 경로에 **GET을 보내면 목록 조회, POST를 보내면 구독 등록**입니다. 라이브러리가 맞게 나눠 보냅니다.

## 알림함

```ts
const result = await dc.notifications.messages("I", 1); // I: 내 글/댓글, U: 구독한 글
for (const item of result.lists ?? []) console.log(item.alarm_type, item.title, item.message);

for await (const page of dc.notifications.messagePages("U")) { /* … */ }

await dc.notifications.deleteMessages(["idx1", "idx2"]);
await dc.notifications.deleteAllMessages();
```

## 설정

```ts
const settings = await dc.notifications.settings();
await dc.notifications.updateSettings({use_yn: 1, keyword: 0, recomm: 1});
await dc.notifications.setReceive("programming", 123, false); // 특정 글 알림 끄기
await dc.notifications.articleConfig("programming", 123);
```

## 구독

| 대상 | 목록 | 등록 | 해제 |
| --- | --- | --- | --- |
| 글 | `articles({gallery, type})` | `subscribeArticle({...})` | `unsubscribeArticle(gallery, no)` |
| 이용자 | `users(gallery?)` | `subscribeUser({...})` | `unsubscribeUser(gallery, userId)` |
| 키워드 | `keywords(gallery?)` | `subscribeKeyword(gallery, keyword)` | `unsubscribeKeyword(...)`, `unsubscribeAllKeywords(gallery)` |
| 개념글 | `recommends()` | `subscribeRecommend(gallery)` | `unsubscribeRecommend(gallery)` |
| 공지 | `notices()` | `subscribeNotice(gallery)` | `unsubscribeNotice(gallery)` |
| 댓글 | | `subscribeComment(gallery, no, commentNo)` | 없음 |

```ts
await dc.notifications.subscribeArticle({
    gallery: "programming",
    no: 123,
    galleryName: "프로그래밍",
    nickname: "작성자",
    subject: "제목"
});
```

댓글 알림은 앱도 `comment_del.php`에 `mode=comment_noti`로 보냅니다. 끄는 API는 앱에도 없습니다.

## 마이너 갤러리 매니저 알림

로그인이 필요합니다.

```ts
await dc.notifications.minorNotification("mi$abc");
await dc.notifications.confirmMinorNotification("mi$abc", no);
```
