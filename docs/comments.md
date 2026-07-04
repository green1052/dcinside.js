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

여러 디시콘을 한 댓글에 연속으로 넣으려면 `detailIndices` 배열을 전달합니다. 각 디테일의 패키지가 다르면 `detailPackageIds`로 지정할 수 있습니다.

```ts
await client.gallery("mi$bjwg64").article(1557).comments.write({
    content: {
        type: "dccon",
        dccon: {
            detailIndices: [8884844, 8884845],
            detailPackageIds: ["123", "456"],
            imgLink: "https://...",
        },
    },
});
```

### 캡챠 (보안코드)

댓글 작성 시 보안코드가 필요하면 `CaptchaRequiredError`가 throw 됩니다. `captcha` 옵션으로 답변을 전달해 재시도합니다.

```ts
await client.gallery("mi$bjwg64").article(1557).comments.write({
    content: "댓글 내용",
    captcha: {code: "1234", dccode: "세션식별자"},
});
```

### 성인 갤러리

성인 인증이 필요한 갤러리에서는 `adultCode`를 함께 전달합니다.

```ts
await client.gallery("mi$bjwg64").article(1557).comments.write({
    content: "댓글 내용",
    adultCode: "성인인증코드",
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
