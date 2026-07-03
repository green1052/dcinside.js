# 게시글

`client.gallery(...).articles`는 게시글 목록/작성 같은 갤러리 단위 작업을, `client.gallery(...).article(id)`는 읽기/삭제/추천/신고 같은 게시글 단위 작업을
담당합니다.

## 목록

```ts
const gallery = client.gallery("mi$bjwg64");

const list = await gallery.articles.list({
    page: 1,
    searchKeyword: "키워드",
    searchType: "all",
    recommend: false,
    notice: false,
    headId: 0,
});
```

| 옵션            | 타입                                                     | 설명                              |
|-----------------|----------------------------------------------------------|-----------------------------------|
| `page`          | `number?`                                                | 1부터 시작하는 페이지 번호입니다. |
| `searchKeyword` | `string?`                                                | 검색어입니다.                     |
| `searchType`    | `"all" \| "subject" \| "memo" \| "name" \| "subject_m"?` | 검색 대상입니다.                  |
| `recommend`     | `boolean?`                                               | 추천글만 조회합니다.              |
| `notice`        | `boolean?`                                               | 공지만 조회합니다.                |
| `headId`        | `number?`                                                | 말머리 ID로 필터링합니다.         |

반환값은 `{gallery, articles, raw}`입니다. `raw`에는 DCInside 원본 응답이 들어갑니다.

## 읽기

```ts
const article = await client.gallery("mi$bjwg64").article(1557).read();

console.log(article.info.subject);
console.log(article.main.content);
```

`info`에는 제목, 작성자, 조회수, 이전/다음 글, 말머리 같은 메타데이터가 들어갑니다. `main`에는 본문 HTML, 추천수, 비추천수 등이 들어갑니다.

## 작성

글 작성은 세션이 필요합니다. 익명 글은 `useAnonymous`, 로그인 글은 `login`을 먼저 호출하세요.

```ts
client.useAnonymous("ㅇㅇ", "password");
const gallery = client.gallery("mi$bjwg64");

const result = await gallery.articles.write({
    subject: "제목",
    content: [
        "단순 텍스트",
        {type: "text", text: "텍스트 블록"},
        {type: "html", html: "<b>HTML</b>"},
        {type: "markdown", markdown: "# 마크다운"},
        {type: "image", file: imageBlob},
        {type: "dccon", imageTag: dccon.imageTag!, detailIndex: 8884844},
    ],
    headText: {no: 1, name: "정보"},
});

console.log(result.articleId);
```

| `content` 형태                           | 설명                                                          |
|------------------------------------------|---------------------------------------------------------------|
| `string`                                 | 텍스트를 HTML 이스케이프한 뒤 `<div>`로 감싸 전송합니다.      |
| `{type: "text", text}`                   | 문자열 형태와 같습니다.                                       |
| `{type: "html", html}`                   | 전달한 HTML을 그대로 전송합니다. 신뢰한 HTML에만 사용하세요.  |
| `{type: "markdown", markdown}`           | 현재는 Markdown 렌더링 없이 이스케이프된 텍스트로 전송합니다. |
| `{type: "image", file}`                  | 이미지 `Blob`/`File`을 첨부합니다.                            |
| `{type: "dccon", imageTag, detailIndex}` | `client.dccons.insert(...)`로 받은 디시콘 태그를 삽입합니다.  |

`subject`는 공백만 있으면 요청 전에 거부됩니다. `content`도 최소 한 블록이 필요합니다.

## 수정

```ts
const gallery = client.gallery("mi$bjwg64");
const article = gallery.article(1557);
const info = await article.modifyInfo();

await gallery.articles.write({
    articleId: 1557,
    mode: "modify",
    subject: info.subject ?? "수정 제목",
    content: ["수정 본문"],
});
```

`mode: "modify"`에는 `articleId`가 필수입니다. `modifyInfo`는 기존 본문, 첨부 파일 정보, 말머리 목록을 반환합니다.

## 삭제

```ts
const deleted = await client.gallery("mi$bjwg64").article(1557).delete();
```

익명 글은 작성 당시 비밀번호와 같은 익명 세션으로 삭제해야 합니다.

## 추천과 신고

```ts
const article = client.gallery("mi$bjwg64").article(articleId);

await article.upvote();
await article.downvote();
await article.hitUpvote();

const reportUrl = await article.reportLink();
```