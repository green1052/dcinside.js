# 관리 `dc.management`

로그인과 해당 갤러리 매니저 권한이 필요합니다. 미니/인물 갤러리는 `mi$`/`pr$` 접두사로 구분합니다.

## 글 관리 (`_manager_request.php`)

```ts
await dc.management.setNotice("mi$abc", 123);       // 공지 지정/해제
await dc.management.setRecommend("mi$abc", 123);    // 개념글 지정/해제
await dc.management.bump("mi$abc", 123);            // 끌어올리기
await dc.management.changeHeadText("mi$abc", 123, 2);
await dc.management.reorderNotices("mi$abc", 123, [130, 125, 123]);
await dc.management.fixToday("mi$abc", 123);
```

## 이미지 차단

```ts
await dc.management.blockImage("mi$abc", 123, {rel1, rel2, imgSrc, subject});
await dc.management.clearImageBlock("mi$abc", {rel1, rel2});
```

`rel1`/`rel2`는 글 이미지의 `data-rel1`/`data-rel2` 값입니다(`view_main.pum_info`와 본문 이미지 속성에 있음).

## 이용자 차단

```ts
await dc.management.blockUser({
    gallery: "mi$abc",
    no: 123,
    commentNo: 456,      // 댓글 작성자 차단
    hours: 24,
    category: "custom",  // obscene | advertisement | cussWords | spamming | piracy | defamation | custom
    reason: "사유"
});

await dc.management.blockNoMember({
    gallery: "mi$abc",
    proxyUntil: new Date(Date.now() + 86_400_000),
    image: {until: new Date(Date.now() + 86_400_000), status: "A"}
});
```

이 두 가지는 앱이 아니라 모바일 웹 엔드포인트입니다. 앱은 같은 기능을 웹페이지로 엽니다.

```ts
await dc.management.blockUserUrl("mi$abc", 123, 456);
await dc.management.settingsUrl("mi$abc");                 // 갤러리 관리 페이지
await dc.management.settingsUrl("programming", {main: true});
```

## 매니저

```ts
await dc.management.history("mi$abc", {category: "avoid", page: 1, mine: false});
await dc.management.managerInfo("mi$abc");
await dc.management.entrust("mi$abc", "위임 메모");
await dc.management.respondAppointment("mi$abc", mode, true);
```
