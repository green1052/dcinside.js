# 갤러리 관리 (Management)

`client.management`로 공지사항 설정, 추천/비추천 설정, 말머리 변경, 유저 차단 등 갤러리 관리 기능을 다룹니다.

> 모든 관리 기능은 로그인 세션이 필요하며, 해당 갤러리의 관리자 권한이 있어야 합니다.

## 공지사항 설정

```ts
await client.management.setNotice({
    galleryId: "bjwg64",
    galleryType: "minor",
    articleId: 1557,
    mode: "notice_on",  // "notice_on" | "notice_off"
});
```

## 추천/비추천 설정

```ts
await client.management.setRecommend({
    galleryId: "bjwg64",
    galleryType: "minor",
    articleId: 1557,
    mode: "recommend_on",  // "recommend_on" | "recommend_off"
});
```

## 말머리 변경

```ts
await client.management.changeHeadText({
    galleryId: "bjwg64",
    galleryType: "minor",
    articleId: 1557,
    headText: {
        no: 0,
        name: "일반",
    },
});
```

## 유저 차단

```ts
await client.management.blockUser({
    galleryId: "bjwg64",
    galleryType: "minor",
    userId: "차단할유저ID",
    mode: "add",  // "add" | "del"
});
```

## 비회원 차단

```ts
await client.management.blockNoMember({
    galleryId: "bjwg64",
    galleryType: "minor",
    ip: "192.168.0.1",
    mode: "add",  // "add" | "del"
});
```

## 관리 페이지 링크

```ts
// 갤러리 설정 링크
const settingUrl = await client.management.gallerySettingLink({
    galleryId: "bjwg64",
    galleryType: "minor",
});

// 유저 차단 링크
const blockUrl = await client.management.userBlockLink({
    galleryId: "bjwg64",
    galleryType: "minor",
});
```