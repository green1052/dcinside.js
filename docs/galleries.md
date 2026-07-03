# 갤러리

`client.galleries`는 마이너/미니 갤러리 정보, 앱 메인 페이지, 랭킹, 영상 업로드를 담당합니다.

## 마이너/미니 갤러리 정보

```ts
const info = await client.galleries.minorInfo("bjwg64");

console.log(info.koName);
console.log(info.manager);
console.log(info.subManagers);
console.log(info.mini);
```

`minorInfo`는 갤러리 ID 문자열을 직접 받습니다. 미니 갤러리 정보가 있으면 `mini` 필드에 가입자 수, 제한 수, 가입 여부가 들어갑니다.

## 앱 메인 페이지

```ts
const main = await client.galleries.mainPage();

console.log(main.hit);
console.log(main.best);
console.log(main.issueZoom);
console.log(main.newGallery);
```

## 랭킹

```ts
const mainRanking = await client.galleries.rankings.main();
const minorRanking = await client.galleries.rankings.minor();
const miniRanking = await client.galleries.rankings.mini();
const personRanking = await client.galleries.rankings.person();
```

랭킹 항목은 `galleryLink`, `galleryId`, `galleryName`, `rankType`, `rank`, `rankDelta`를 포함합니다.

## 영상 업로드

```ts
const result = await client.galleries.uploadMovie({
    gallery: "mi$bjwg64",
    file: videoBlob,
    checkRestriction: true,
});

console.log(result.fileId);
console.log(result.thumbnailUrls);
```

`checkRestriction`은 기본값이 `true`입니다. 업로드 제한이 있으면 업로드 전에 에러를 던집니다.
