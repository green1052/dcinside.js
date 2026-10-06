# 미디어

## 업로드 `dc.uploads`

```ts
await dc.uploads.images([Bun.file("a.png"), Bun.file("b.png")]); // upload_img_auto.php

// 동영상: 업로드 → 정보 등록 → write({movies})
await dc.galleries.uploadRestriction("programming", "movie");
const video = await dc.uploads.movie("programming", Bun.file("clip.mp4"));
await dc.uploads.movieInfo({gallery: "programming", thumbnail, width: 1280, height: 720, description: "설명"});
await dc.uploads.modifyMovieInfo({gallery: "programming", token, movieNo, description: "수정"});

// 보이스
await dc.uploads.voice("programming", new File([bytes], "voice.m4a"), {name: "ㅇㅇ", downloadable: true});
await dc.uploads.voiceDownload(vr);
```

## 자동짤 `dc.autoImages`

글 쓸 때 자동으로 붙는 이미지입니다. 로그인이 필요합니다. 갤러리를 생략하면 "전체 기본"(앱의 `X`)입니다.

```ts
const uploaded = await dc.uploads.images([Bun.file("zzal.png")]);

await dc.autoImages.add([imageUrl], "programming");
await dc.autoImages.list("programming");
await dc.autoImages.setMain(imageUrl, "programming");
await dc.autoImages.setting(true, {gallery: "programming"});              // 사용
await dc.autoImages.setting(true, {gallery: "programming", random: true}); // 랜덤
await dc.autoImages.remove([imageUrl], "programming");

await dc.autoImages.galleries();  // 자동짤을 쓰는 갤러리
await dc.autoImages.myImages();   // 내가 올린 전체
await dc.autoImages.removeMine([imageUrl]);
```

## AI 이미지 `dc.ai`

글쓰기 메뉴의 AI 이미지 생성입니다. 로그인이 필요합니다.

```ts
const status = await dc.ai.status(); // models, samples, generate_cnt(남은 횟수) 등

const result = await dc.ai.generate({
    gallery: "programming",
    prompt: "a cat",
    negativePrompt: "",
    model: Object.keys(status.models ?? {})[0]!,
    sampling: status.samples?.ani?.[0]!,
    upscale: false
});

await dc.ai.prompts();
await dc.ai.savePrompt({title: "고양이", prompt: "a cat"});
await dc.ai.savePrompt({idx: 3, prompt: "a dog"});
await dc.ai.deletePrompt(3);
await dc.ai.characterPrompt("캐릭터");
await dc.ai.fillPrompts(new File([bytes], "ref.png")); // 이미지에서 프롬프트 추출
await dc.ai.resample("programming", new File([bytes], "ref.png"));
```

`models`/`samples`의 정확한 값 형식은 서버 응답을 보고 고르세요. 타입은 `AiImageStatus`입니다.
