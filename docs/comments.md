# 댓글

`client.comments`는 댓글 목록, 댓글 작성, 답글 작성, 삭제를 담당합니다.

## 목록

```ts
const comments = await client.comments.list({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
    page: 1,
});

console.log(comments.totalComments);
console.log(comments.totalPages);
console.log(comments.comments);
```

`CommentData.content`는 일반 텍스트 또는 디시콘 정보입니다. 삭제된 댓글은 `deleteFlag` 값이 채워질 수 있습니다.

## 작성

```ts
client.useAnonymous("닉네임", "비밀번호");

const result = await client.comments.write({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
    content: "댓글 내용",
});
```

디시콘 댓글은 `CommentContent` 형태로 보냅니다.

```ts
await client.comments.write({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
    content: {
        type: "dccon",
        dccon: {
            detailIndex: 8884844,
            imgLink: "https://...",
            memo: "디시콘 설명",
        },
    },
});
```

## 답글

```ts
await client.comments.reply({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
    replyToCommentId: 12345,
    content: "답글 내용",
});
```

## 삭제

```ts
await client.comments.delete({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
    commentId: 12345,
});
```
