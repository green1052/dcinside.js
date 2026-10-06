# 갤러리·검색

## 갤러리 `dc.galleries`

```ts
await dc.galleries.info("mi$bjwg64");                 // 마이너/미니/인물 소개, 매니저
await dc.galleries.info("programming", {main: true}); // 메인 갤러리
await dc.galleries.personProfile("pr$dororong");
await dc.galleries.gallogCount("user_id");            // 갤로그 글/댓글 수
await dc.galleries.rank(["programming", "mi$abc"]);   // 현재 순위
await dc.galleries.uploadRestriction("programming", "img"); // 제한이면 ApiError
```

### 랭킹·흥한 갤

```ts
await dc.galleries.ranking("main");   // main | minor | mini | person
await dc.galleries.hot("minor");      // 흥한 갤러리
```

### 앱 메인 화면

```ts
await dc.galleries.main();            // 힛갤, 이슈줌 등
await dc.galleries.liveBest();        // 실시간 베스트
await dc.galleries.recommended(key);  // 탭별 추천 글
await dc.galleries.categories();      // 카테고리
await dc.galleries.names();           // 전체 갤러리 이름 (큼)
```

### 펌

```ts
await dc.galleries.pumInfo("programming");
await dc.galleries.pumHistory("programming", 123);
```

## 검색 `dc.search`

앱 5.3.6의 `_total_search_new.php`를 씁니다.

```ts
const result = await dc.search.search("프로그래밍", {
    type: "search_main", // search_main | gall_name | wiki | gall_content | movie | pum_gall | default(자동완성)
    page: 1,
    sort: "recency"      // gall_content 정렬: rankup | recency
});

result.gall_list;    // 갤러리
result.recomm_list;  // 추천 갤러리
result.board;        // 게시글
result.wiki;
result.movie;
result.info;         // 섹션별 total_page
```

## 앱 정보 `dc.app`

```ts
await dc.app.check();        // 점검 여부, app_id 발급용 date
await dc.app.updateNotice();
await dc.app.notice();
```
