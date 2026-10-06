# 댓글 `dc.comments`

## 목록

```ts
const result = await dc.comments.list("programming", 123, {
    page: 1,
    sort: "reply",   // 생략하면 앱 기본(style=new), "new" | "reply"
    password: "...", // 비밀글
    commentNo: 456   // 이 댓글이 있는 페이지
});

result.total_comment;
result.total_page;
result.comment_list; // 댓글(name, user_id, comment_memo, dccon, voice, mention, …)
```

```ts
for await (const page of dc.comments.pages("programming", 123)) { /* … */ }
```

이미지 댓글과 글 안 댓글 검색도 지원합니다.

```ts
await dc.comments.imageComments("programming", 123, fileNo);
await dc.comments.search("programming", 123, "키워드");
await dc.comments.search("programming", 123, undefined, {mine: true}); // 내 댓글 (로그인)
```

## 작성

세션이 필요합니다.

```ts
await dc.comments.write("programming", 123, "댓글");

// 답글: 부모 댓글을 그대로 넘깁니다. 앱처럼 부모의 user_id를 reple_id로 보냅니다.
const parent = result.comment_list![0]!;
await dc.comments.reply("programming", 123, parent, "답글");

// 디시콘 (최대 2개)
const inserted = await dc.dccons.insert({package_idx: 1, detail_idx: 2});
await dc.comments.write("programming", 123, {dccons: [{tag: inserted.img_tag!, detailIdx: 2}]}, {bigDccon: true});
```

| 옵션 | 설명 |
| --- | --- |
| `parent`, `mention` | 답글 대상, 멘션 댓글 여부 |
| `article` | `articles.read()`의 `view_info`. 베스트 댓글 필드(`best_chk` 등)를 채웁니다 |
| `captcha` | `{key, code}` |
| `adultCode` | 성인 인증 코드(유동) |
| `useGalleryNickname`, `bigDccon`, `textcon` | 갤닉, 큰 디시콘, 텍스트콘 색 |

보이스 댓글은 파일을 함께 올립니다.

```ts
await dc.comments.writeVoice("programming", 123, new File([bytes], "voice.m4a"), {text: "보이스", downloadable: true});
```

## 삭제

```ts
await dc.comments.delete("programming", 123, commentNo);
```
