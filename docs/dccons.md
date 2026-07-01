# 디시콘 (DCCon)

`client.dccons`로 디시콘 목록, 상세, 삽입, 구매를 다룹니다.

## 목록

```ts
const dccons = await client.dccons.list({
    galleryId: "bjwg64",
    galleryType: "mini",
});

console.log(dccons.length);  // 디시콘 수
console.log(dccons[0]);      // DCConItem
```

### DCConItem

| 필드        | 타입      | 설명          |
|-------------|-----------|---------------|
| `detailIdx` | `number`  | 디시콘 인덱스 |
| `title`     | `string`  | 디시콘 이름   |
| `imageUrl`  | `string`  | 이미지 URL    |
| `isBuy`     | `boolean` | 구매 여부     |

## 상세

```ts
const detail = await client.dccons.detail({
    galleryId: "bjwg64",
    galleryType: "mini",
    detailIndex: 8884844,
});
```

## 삽입

게시글/댓글에 디시콘을 삽입할 때 사용합니다. 로그인 세션이 필요합니다.

```ts
const result = await client.dccons.insert({
    galleryId: "bjwg64",
    galleryType: "mini",
    detailIndex: 8884844,
});
```

## 구매

```ts
const result = await client.dccons.buy({
    galleryId: "bjwg64",
    galleryType: "mini",
    detailIndex: 8884844,
});
```