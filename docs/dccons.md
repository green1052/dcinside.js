# 디시콘 `dc.dccons`

보유 목록, 폴더, 구매는 로그인이 필요합니다.

## 목록·상세

```ts
const owned = await dc.dccons.list();      // 탭과 보유 디시콘
const recent = await dc.dccons.recent();   // 최근 사용
const detail = await dc.dccons.detail(packageIdx);
await dc.dccons.bigDccon();                // 큰 디시콘 사용 가능 여부
```

## 본문/댓글에 넣기

`insert()`로 받은 `img_tag`를 글이나 댓글에 넣습니다. `recent()`/`detail()` 항목을 그대로 넘겨도 됩니다.

```ts
const item = recent[0]!;
const inserted = await dc.dccons.insert(item);

await dc.comments.write("programming", 123, {dccons: [{tag: inserted.img_tag!, detailIdx: item.detail_idx!}]});
await dc.articles.write({
    gallery: "programming",
    subject: "디시콘",
    content: [{type: "dccon", tag: inserted.img_tag!, detailIdx: item.detail_idx!, packageIdx: item.package_idx}]
});
```

## 구매·설정

```ts
await dc.dccons.buy(packageIdx);
await dc.dccons.settings();
await dc.dccons.saveSettings(settingData);
await dc.dccons.deletePackages([1, 2]);
```

## 폴더

```ts
await dc.dccons.folders();
await dc.dccons.addFolder("자주 씀");
await dc.dccons.updateFolder("자주 씀", "즐겨찾기", icons);
await dc.dccons.updateFolderList(folderList);
await dc.dccons.deleteFolder("즐겨찾기");
await dc.dccons.addToFolder(item, folderNames);
await dc.dccons.removeFromFolder(item, "즐겨찾기");
```
