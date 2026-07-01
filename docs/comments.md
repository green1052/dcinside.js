# 댓글 (Comments)

`client.comments`로 댓글 목록, 작성, 답글, 삭제를 다룹니다.

## 목록

```ts
const comments = await client.comments.list({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
    page: 1,
});

console.log(comments.page);       // 현재 페이지
console.log(comments.totalPages); // 전체 페이지 수
console.log(comments.comments);   // Comment[]
```

### Comment

| 필드        | 타입      | 설명          |
|-------------|-----------|---------------|
| `id`        | `number`  | 댓글 번호     |
| `articleId` | `number`  | 원글 번호     |
| `userId`    | `string`  | 작성자 ID     |
| `name`      | `string`  | 작성자 닉네임 |
| `content`   | `string`  | 댓글 내용     |
| `dateTime`  | `string`  | 작성일시      |
| `isReply`   | `boolean` | 답글 여부     |
| `isDccon`   | `boolean` | 디시콘 여부   |
| `parentId`  | `number?` | 부모 댓글 ID  |

## 작성

세션이 필요합니다.

```ts
const result = await client.comments.write({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
    content: "댓글 내용",
});
```

## 답글

```ts
const result = await client.comments.reply({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
    commentId: 12345,
    content: "답글 내용",
});
```

## 삭제

```ts
const comments = await client.comments.list({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
});
```