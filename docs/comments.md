# 댓글

댓글은 `client.gallery(...).article(id).comments` 아래에서 다룹니다.

## 목록

```ts
const comments = await client.gallery("mi$bjwg64").article(1557).comments.list({
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

const result = await client.gallery("mi$bjwg64").article(1557).comments.write({
    content: "댓글 내용",
});
```

디시콘 댓글은 `CommentContent` 형태로 보냅니다.

```ts
await client.gallery("mi$bjwg64").article(1557).comments.write({
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
await client.gallery("mi$bjwg64").article(1557).comments.reply({
    replyToCommentId: 12345,
    content: "답글 내용",
});
```

## 삭제

```ts
await client.gallery("mi$bjwg64").article(1557).comments.delete({
    commentId: 12345,
});
```
