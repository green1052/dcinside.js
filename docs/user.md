# 사용자 (User)

`client.user`로 내 갤러리, 관리 갤러리, 가입된 미니 갤러리, 즐겨찾기, 미니 갤러리 가입/탈퇴를 다룹니다.

## 내 갤러리

```ts
const myGall = await client.user.myGalleries();
console.log(myGall.galleries);    // MyGallery[]
console.log(myGall.favorites);     // FavoriteGallery[]
```

## 즐겨찾기 추가

```ts
await client.user.addFavoriteGallery({
    galleryId: "bjwg64",
    galleryType: "minor",
});
```

## 관리 갤러리 확인

```ts
const managed = await client.user.managedGalleries();
console.log(managed);  // 관리 중인 갤러리 정보
```

## 가입된 미니 갤러리

```ts
const joined = await client.user.joinedMiniGalleries();
console.log(joined);  // 가입한 미니 갤러리 목록
```

## 미니 갤러리 가입

```ts
// 가입 요청
await client.user.requestMiniJoin({
    galleryId: "bjwg64",
});

// 가입 확인 (인증 코드 필요 시)
await client.user.confirmMiniJoin({
    galleryId: "bjwg64",
    code: "인증코드",
});

// 가입 완료
await client.user.joinMiniGallery({
    galleryId: "bjwg64",
});
```

## 미니 갤러리 탈퇴

```ts
await client.user.quitMiniGallery({
    galleryId: "bjwg64",
});
```