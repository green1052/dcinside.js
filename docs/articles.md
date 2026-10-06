# 게시글 `dc.articles`

## 목록

```ts
const result = await dc.articles.list({
    gallery: "programming",
    page: 1,
    search: {keyword: "bun", type: "subject"}, // subject_m(기본) | subject | memo | name | comment | date
    headId: 1,            // 말머리
    filter: "recommend",  // recommend(개념글) | notice | best
    thumbnail: true       // 썸네일 목록
});

result.gall_info?.[0]; // 갤러리 정보(GalleryInfo): 말머리, 권한, 캡챠 여부 등
result.gall_list;      // 글 목록(PostItem[])
```

검색 결과가 많으면 `gall_info[0].ser_pos`를 `search.pos`로 넘겨 다음 구간을 봅니다.

빈 페이지가 나올 때까지 순회하려면 이렇게 씁니다.

```ts
for await (const page of dc.articles.pages({gallery: "programming"})) {
    for (const post of page.gall_list ?? []) console.log(post.no, post.subject);
}
```

## 읽기

```ts
const view = await dc.articles.read("programming", 123, {password: "비밀글 비번"});
view.view_info;  // PostInfo: 제목, 작성자, 추천/댓글 수, 이전/다음 글
view.view_main;  // 본문 memo(HTML), 추천/비추천 수, 펌 정보

const images = await dc.articles.images("programming", 123); // 원본 이미지 주소
```

## 쓰기·수정

세션이 필요합니다.

```ts
await dc.articles.write({
    gallery: "programming",
    subject: "제목",
    content: [
        "텍스트",
        {type: "html", html: "<p>HTML</p>"},
        {type: "image", file: Bun.file("a.png")},
        {type: "dccon", tag: inserted.img_tag!, detailIdx: 123, packageIdx: 45}
    ],
    headText: {no: 1, name: "일반"},
    secret: "비밀번호",     // 비밀글(true면 비밀번호 없이)
    useGalleryNickname: true,
    captcha: {key, code}
});

// 수정: articleNo를 넘기면 mode=modify
const before = await dc.articles.modifyInfo("programming", 123);
await dc.articles.write({gallery: "programming", articleNo: 123, subject: "새 제목", content: ["새 본문"]});
```

본문은 앱과 똑같이 `memo_block[i]`로 나눠 보냅니다. 텍스트 블록은 `<div>`로 감싸고, 줄바꿈은 `<br>`, 연속 공백은 `&nbsp;`로 바꿉니다.

## 삭제·추천

```ts
await dc.articles.delete("programming", 123);           // mode=board_del2
await dc.articles.upvote("programming", 123);           // 추천
await dc.articles.downvote("programming", 123);         // 비추천
await dc.articles.hitRecommend("programming", 123);     // 힛추
await dc.articles.bestRecommend("programming", 123);    // 베스트 콘텐츠 추천
```

추천에 캡챠가 걸리면 `CaptchaRequiredError`가 납니다. `captchaUrl("recommend", key, gallery)`로 이미지를 받아 답과 함께 다시 호출하세요.

## 투표

```ts
const poll = await dc.articles.createPoll({
    gallery: "programming",
    title: "점심 메뉴",
    items: ["짜장", "짬뽕"],
    multiple: 2,
    endDate: "2026-12-31 23:59"
});
// 응답(poll)에 담긴 투표 키를 write의 vote로 넘깁니다.
await dc.articles.write({gallery: "programming", subject: "투표", content: ["골라줘"], vote: voteKey});

await dc.articles.modifyPoll("programming", 123, voteConfirm, "2027-01-01 00:00");
await dc.articles.finishPoll(conKey, pollId, password);
```

## 기타

| 메서드 | 설명 |
| --- | --- |
| `related(gallery)` | 연관 갤러리/디시콘 |
| `linkPreview(url)` | 링크 OG 미리보기 |
| `transferInfo(no)` / `cancelTransfer(no)` | 내 글 이전 정보/취소 |
| `reportUrl(gallery, no)` | 신고 웹페이지 주소 |
