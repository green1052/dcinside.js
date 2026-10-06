# 갤로그 `dc.gallog`

앱에는 갤로그용 JSON API가 없습니다. 작성자를 누르면 `m.dcinside.com/gallog/{user_id}`를 웹뷰로 엽니다.
이 모듈은 그 페이지를 앱 웹뷰와 같은 User-Agent로 읽어 목록으로 바꿔 줍니다. 앱 API용 UA(`dcinside.app`)만 보내면 403이 납니다.

세션 없이 볼 수 있습니다. 로그인했으면 앱처럼 `app_id`/`confirm_id`를 붙여서 보내기 때문에 내 비공개 글도 보입니다.

## 홈

```ts
const home = await dc.gallog.home("user_id");
home.nickname;       // "닉네임"
home.postCount;      // 게시물 수
home.commentCount;   // 댓글 수
home.todayVisitors;  // 오늘 방문자
home.totalVisitors;
home.profileImage;   // 프로필 이미지 주소
```

## 게시글·댓글

```ts
const posts = await dc.gallog.posts("user_id", {category: "all", page: 1}); // all | board | minor | mini | person
posts.counts;    // {all, board, minor, mini, person}
posts.public;    // false면 비공개라 목록이 비어 있음
posts.nextPage;  // 다음 페이지 번호, 없으면 null

for (const item of posts.items) {
    console.log(item.galleryName, item.no, item.text, item.date, item.commentCount);
}

const comments = await dc.gallog.comments("user_id", {page: 2});
comments.items[0]?.text;          // 댓글 내용
comments.items[0]?.originalTitle; // 원글 제목
```

다음 페이지까지 모두 읽으려면 `nextPage`를 따라가면 됩니다.

```ts
for (let page: number | null = 1; page; ) {
    const result = await dc.gallog.posts("user_id", {page});
    // …
    page = result.nextPage;
}
```

## 원글 열기

항목에는 갤러리 ID 대신 갤로그 내부 코드(`gallCode`)가 들어 있습니다. `resolveGallery()`로 앱 API에서 쓰는 갤러리 ID(`mi$`/`pr$` 포함)를 얻으세요.

```ts
const item = posts.items[0]!;
const gallery = await dc.gallog.resolveGallery(item); // "programming", "mi$abc" …
const article = await dc.articles.read(gallery, item.no);
```

## 스크랩·방명록

```ts
await dc.gallog.scraps("user_id", 1);
const guestbook = await dc.gallog.guestbook("user_id");
guestbook[0]; // {nickname, userId?, text, date, secret}
```

## 주소

```ts
await dc.gallog.url("user_id"); // 앱이 여는 주소 (app_id, confirm_id 포함)
```

웹페이지를 파싱하므로 디시가 페이지 마크업을 바꾸면 결과가 비거나 깨질 수 있습니다.
