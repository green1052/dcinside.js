# 사용자

`client.user`는 로그인 계정 기준의 내 갤러리, 즐겨찾기, 관리 갤러리, 미니 갤러리 가입/탈퇴 기능을 담당합니다. 모든 메서드는 로그인 세션이 필요합니다.

```ts
await client.login("아이디", "비밀번호");
```

## 내 갤러리와 즐겨찾기

```ts
const result = await client.user.myGalleries();

console.log(result.myGallery);
console.log(result.favorite);
```

## 즐겨찾기 추가

```ts
await client.user.addFavoriteGallery({
    id: "programming",
    title: "프로그래밍",
    type: "minor",
});
```

## 관리 중인 갤러리

```ts
const managed = await client.user.managedGalleries();

console.log(managed);
```

## 가입된 미니 갤러리

```ts
const joined = await client.user.joinedMiniGalleries();

console.log(joined.joined);
console.log(joined.pending);
console.log(joined.left);
```

## 미니 갤러리 가입

```ts
const request = await client.user.requestMiniJoin("bjwg64");
console.log(request.joinQuestion);

const confirm = await client.user.confirmMiniJoin("bjwg64");

const joined = await client.user.joinMiniGallery("bjwg64");
```

`joinMiniGallery`는 가입 요청과 확인을 한 번에 실행합니다. 가입 요청이 실패하면 `confirm`은 `null`입니다.

## 미니 갤러리 탈퇴

```ts
await client.user.quitMiniGallery("bjwg64");
```
