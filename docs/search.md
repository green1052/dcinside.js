# 검색 (Search)

`client.search`로 갤러리 검색, 통합 검색을 다룹니다.

## 갤러리 검색

```ts
const galleries = await client.search.galleries({
    keyword: "축구",
});

console.log(galleries);  // SearchGallery[]
```

### SearchGallery

| 필드    | 타입     | 설명        |
|---------|----------|-------------|
| `id`    | `string` | 갤러리 ID   |
| `title` | `string` | 갤러리 제목 |
| `type`  | `string` | 갤러리 타입 |

## 통합 검색

```ts
const results = await client.search.total({
    keyword: "키워드",
});

console.log(results.raw);  // 원본 응답
```