# 사용자 `dc.user`

모두 로그인이 필요합니다.

## 내 갤러리·즐겨찾기

```ts
await dc.user.myGalleries();                       // 내 갤러리 + 즐겨찾기
await dc.user.addFavorite("programming", "프로그래밍");
await dc.user.sortFavorites(["programming", "mi$abc"]);
await dc.user.clearFavorites();
await dc.user.managedGalleries();                  // 관리 중인 갤러리
await dc.user.joinedMiniGalleries();               // 가입/대기/탈퇴 미니갤
```

## 미니 갤러리 가입

```ts
const join = await dc.user.joinMini("mi$abc");     // 가입 질문 확인
await dc.user.confirmMiniJoin("mi$abc", "질문 답"); // 신청 (question_memo)
await dc.user.cancelMiniJoin("mi$abc");
await dc.user.quitMini("mi$abc");
```

## 스크랩

```ts
const folders = await dc.user.scrapFolders();
await dc.user.editScrapFolder("add", "새 폴더");
await dc.user.editScrapFolder("modify", "이름 변경", folderNo);
await dc.user.deleteScrapFolder(folderNo, moveToFolderNo);
await dc.user.sortScrapFolder(folderNo, "prev", targetFolderNo);

await dc.user.addScrap({id: "programming", no: 123});
await dc.user.addScraps(folderNo, [{id: "programming", no: 1}, {id: "programming", no: 2}]);
await dc.user.moveScrap(scrapNo, folderNo, true);
await dc.user.deleteScrap({id: "programming", no: 123});
```

`ScrapTarget.type`은 앱 내부 스크랩 종류 값입니다. 필요할 때만 넘기세요.

## 기타

```ts
await dc.user.hitcon();      // 힛콘 사용 여부 조회
await dc.user.hitcon(true);  // 변경
```
