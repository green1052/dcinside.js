// 앱의 요청 빌더 체인(ApiBase)을 풀어서 엔드포인트 목록을 JSON으로 뽑습니다. 새 앱 버전과 비교할 때 씁니다.
//
// 사용법: jadx로 APK를 디컴파일한 뒤
//   bun scripts/extract-endpoints.ts <jadx 출력>/sources/com/dcinside/app/util/Hp.java com.dcinside.app.util.Hp > endpoints.json
//   bun scripts/extract-endpoints.ts <…>/util/C4374m4.java com.dcinside.app.util.C4374m4 >> …
//
// 앱은 `Ck()`(GET)/`Bl()`(multipart POST) 빌더에 람다로 조각을 넘깁니다.
//   Y: 기본 URL, S: 경로 조각, U: 쿼리, g0: 폼 필드, i0: 파일, B: 응답 파서, Ck().W(): redirect.php로 감쌈
// 클래스 이름(Hp, C4374m4)은 난독화 결과라 버전마다 바뀔 수 있습니다. "https://app.dcinside.com/"을 많이 담은 파일을 찾으세요.
const [file, cls] = [process.argv[2]!, process.argv[3]!];
const src = await Bun.file(file).text();

const head = /^    (?:(?:public|private|static|final|protected|\/\* synthetic \*\/) )*static [^\n]*?\b(\w+)\(/gm;
const idx = [...src.matchAll(head)].map((m) => ({name: m[1]!, at: m.index!}));
const bodies = new Map<string, string[]>();
idx.forEach((m, i) => {
    const b = src.slice(m.at, idx[i + 1]?.at ?? src.length);
    bodies.set(m.name, [...(bodies.get(m.name) ?? []), b]);
});

const esc = cls.replace(/\./g, "\\.");
const chainRe = new RegExp(String.raw`\.(\w+)\(new [\w.$]+\(\) \{ // from class: [\w.$]+\s+@Override[^\n]*\n\s+public final [^{]+\{\s+(?:return )?` + esc + String.raw`\.(\w+)\(`, "g");
const lambdaBody = (n: string) => (bodies.get(n) ?? [])
    .map((b) => b.split("\n").slice(1).join("\n").replace(/\s+/g, " ").replace(/kotlin\.Y0\.f133735a/g, "_").slice(0, 400))
    .join(" || ");

const specs = [];
for (const {name} of idx) {
    for (const body of bodies.get(name)!) {
        const first = body.split("\n")[0]!;
        if (first.includes("/* synthetic */") || !/\bpublic\b/.test(first)) continue;
        const steps = [...body.matchAll(chainRe)].map((m) => ({op: m[1]!, fn: m[2]!}));
        if (!steps.some((s) => s.op === "Y")) continue;
        const parsers = steps.filter((s) => s.op === "B").flatMap((s) => bodies.get(s.fn) ?? []).join("\n");
        const parse = /T\.a\.f5735a\.([ab])\([^,]+, \w+, ([\w.$]+)\.class\)/.exec(parsers) ?? /\.(r)\(\w+, ([\w.$]+)\.class\)/.exec(parsers);
        specs.push({
            name,
            method: /\.Bl\(\)/.test(body) ? "POST" : /\.Ck\(\)/.test(body) ? "GET" : "?",
            redirect: /\.Ck\(\)\.W\(\)/.test(body),
            response: parse ? {array: parse[1] === "b", model: parse[2]} : /rx\.g<(.+?)> \w+\(/.exec(first)?.[1] ?? null,
            signature: first.trim(),
            steps: steps.map((s) => ({op: s.op, body: lambdaBody(s.fn)}))
        });
    }
}
console.log(JSON.stringify(specs, null, 1));
