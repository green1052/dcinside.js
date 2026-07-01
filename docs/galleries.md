# 갤러리 (Galleries)

`client.galleries`로 갤러리 정보, 메인 페이지, 영상 업로드, 랭킹을 다룹니다.

## 마이너 갤러리 정보

```ts
const info = await client.galleries.minorInfo({
    galleryId: "bjwg64",
    galleryType: "minor",
});

console.log(info.title);       // 갤러리 제목
console.log(info.manager);    // 관리자 정보
console.log(info.headTexts);  // 말머리 목록
```

## 메인 페이지

```ts
const main = await client.galleries.mainPage();
console.log(main.raw);  // 원본 응답
```

## 랭킹

```ts
// 메인 갤러리 랭킹
const mainRanking = await client.galleries.ranking.main();

// 마이너 갤러리 랭킹
const minorRanking = await client.galleries.ranking.minor();

// 미니 갤러리 랭킹
const miniRanking = await client.galleries.ranking.mini();

// 인물 갤러리 랭킹
const personRanking = await client.galleries.ranking.person();
```

### GalleryRankingItem

| 필드    | 타입     | 설명        |
|---------|----------|-------------|
| `id`    | `string` | 갤러리 ID   |
| `title` | `string` | 갤러리 제목 |

## 영상 업로드

```ts
const result = await client.galleries.uploadMovie({
    galleryId: "bjwg64",
    galleryType: "mini",
    file: videoBlob,
    checkRestriction: true,  // 기본 true
});

console.log(result.fileId);       // 파일 번호
console.log(result.thumbnailUrls); // 썸네일 URL 배열
```