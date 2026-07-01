# 게시글 (Articles)

`client.articles`로 게시글 목록, 읽기, 작성, 삭제, 추천, 신고를 다룹니다.

## 목록

```ts
const list = await client.articles.list({
    galleryId: "bjwg64",
    galleryType: "mini",   // 생략 시 "main"
    searchKeyword: "키워드",
    searchType: "all",     // "all" | "subject" | "memo" | "name" | "subject_m"
    recommend: false,      // 추천글만
    notice: false,         // 공지만
    headId: 0,             // 말머리 ID
});
```

### 반환값

```
{
    gallery: GalleryInfo,        // 갤러리 메타데이터
    articles: ArticleListItem[], // 게시글 목록
    raw: unknown,                // 원본 응답
}
```

### ArticleListItem

| 필드           | 타입      | 설명             |
|----------------|-----------|------------------|
| `id`           | `number`  | 게시글 번호      |
| `subject`      | `string`  | 제목             |
| `name`         | `string`  | 작성자 닉네임    |
| `userId`       | `string`  | 작성자 ID        |
| `views`        | `number`  | 조회수           |
| `upvotes`      | `number`  | 추천수           |
| `commentCount` | `number`  | 댓글수           |
| `hasImage`     | `boolean` | 이미지 포함 여부 |
| `isBest`       | `boolean` | 베스트 여부      |
| `dateTime`     | `string`  | 작성일시         |
| `headText`     | `string?` | 말머리           |

## 읽기

```ts
const article = await client.articles.read({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
});
```

### 반환값

```
{
    info: ArticleViewInfo, // 게시글 메타데이터
    main: ArticleViewMain, // 본문, 추천/비추천수
    raw: unknown
}
```

## 작성

세션이 필요합니다.

```ts
const result = await client.articles.write({
    galleryId: "bjwg64",
    galleryType: "mini",
    subject: "제목",
    content: [
        "단순 텍스트",
        {type: "text", text: "텍스트 블록"},
        {type: "html", html: "<b>HTML</b>"},
        {type: "markdown", markdown: "# 마크다운"},
        {type: "image", file: imageBlob},
        {type: "dccon", imageTag: "<img ...>", detailIndex: 8884844},
    ],
    headText: {no: 0, name: "말머리"},
    mode: "write",  // "write" | "modify"
});
```

### content 타입

| 형태                                       | 타입     | 설명                               |
|--------------------------------------------|----------|------------------------------------|
| `"문자열"`                                 | `string` | 텍스트 (자동으로 `<div>`로 감싸짐) |
| `{ type: "text", text }`                   | text     | 텍스트 블록                        |
| `{ type: "html", html }`                   | html     | HTML 그대로 전송                   |
| `{ type: "markdown", markdown }`           | markdown | 마크다운 (텍스트로 변환)           |
| `{ type: "image", file }`                  | image    | 이미지 파일 (Blob/File)            |
| `{ type: "dccon", imageTag, detailIndex }` | dccon    | 디시콘                             |

### headText

말머리가 필요한 갤러리에서 `headText`를 지정합니다. `no`는 말머리 번호, `name`은 말머리 이름입니다. 말머리 목록은 `modifyInfo`로 조회할 수 있습니다.

```ts
const info = await client.articles.modifyInfo({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
});
console.log(info.headTexts);  // HeadText[]
```

## 삭제

```ts
const result = await client.articles.delete({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
});
```

## 추천 / 비추천

```ts
await client.articles.upvote({galleryId, galleryType, articleId});
await client.articles.downvote({galleryId, galleryType, articleId});
await client.articles.hitUpvote({galleryId, galleryType, articleId});
```

## 수정 정보

```ts
const info = await client.articles.modifyInfo({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
});
// info.content: ArticleContent[]
// info.files: { block, fileSize }[]
// info.headTexts: HeadText[]
```

## 신고 링크

```ts
const url = await client.articles.reportLink({
    galleryId: "bjwg64",
    galleryType: "mini",
    articleId: 1557,
});
// → "http://m.dcinside.com/api/report.php?app_id=...&id=...&no=..."
```