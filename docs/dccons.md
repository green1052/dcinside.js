# 디시콘

`client.dccons`는 디시콘 목록, 패키지 상세, 본문 삽입용 태그 발급, 구매를 담당합니다.

## 목록

```ts
const dccons = await client.dccons.list();

console.log(dccons.tabs);
console.log(dccons.list);
```

`tabs`는 디시콘 탭 목록이고, `list`는 탭별 디시콘 목록입니다.

## 상세

```ts
const detail = await client.dccons.detail({
    packageIndex: 123,
});

console.log(detail.info);
console.log(detail.detail);
```

## 삽입

게시글 본문에 디시콘을 넣으려면 먼저 삽입용 태그를 발급받은 뒤 `articles.write`의 `content`에 전달합니다.

```ts
const gallery = client.gallery("mi$bjwg64");

const inserted = await client.dccons.insert({
    packageIndex: 123,
    detailIndex: 8884844,
});

await gallery.articles.write({
    subject: "디시콘 테스트",
    content: [
        {
            type: "dccon",
            imageTag: inserted.imageTag!,
            detailIndex: 8884844,
        },
    ],
});
```

### 다중 디시콘 삽입

여러 디시콘을 한 블록에 연속으로 넣으려면 `detailIndices` 배열을 전달합니다. 각 디테일마다 insert API를 호출해 `imageTags`에 태그를 모아 반환합니다. 패키지가 다르면
`detailPackageIds`로 각 디테일의 패키지를 지정할 수 있습니다.

```ts
const inserted = await client.dccons.insert({
    packageIndex: 123,
    detailIndices: [8884844, 8884845],
    detailPackageIds: ["123", "456"],
});

console.log(inserted.imageTags); // ["<img ...>", "<img ...>"]
```

## 구매

```ts
await client.login("아이디", "비밀번호");

const result = await client.dccons.buy({
    packageIndex: 123,
});
```