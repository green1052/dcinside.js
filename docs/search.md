# 검색

`client.search`는 갤러리 검색과 통합 검색을 담당합니다.

## 갤러리 검색

```ts
const result = await client.search.galleries("축구");

console.log(result.mainGallery);
console.log(result.minorGallery);
console.log(result.mainRecommendGallery);
console.log(result.minorRecommendGallery);
```

각 갤러리 항목은 `id`, `title`, `type`을 포함합니다.

## 통합 검색

```ts
const result = await client.search.total("키워드");

console.log(result.mainGallery);
console.log(result.minorGallery);
console.log(result.wiki);
console.log(result.board);
console.log(result.todayIssue);
console.log(result.realTime);
```

게시글 검색 결과는 제목, 요약 내용, 갤러리 ID/이름, 게시글 번호, 작성일을 포함합니다.
