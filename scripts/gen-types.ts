// 앱 Gson 모델에서 응답 타입(src/types/responses.ts)과 런타임 스키마(src/types/schema.json)를 생성합니다.
//
// 사용법: jadx로 APK를 디컴파일한 뒤
//   bun scripts/gen-types.ts <jadx 출력>/sources src/types
// 새 앱 버전에서 모델 클래스 이름(난독화)이 바뀌면 아래 TOP 표를 고쳐야 합니다.
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {APP} from "../src/constants";

const root = process.argv[2]!;
const outDir = process.argv[3]!;

/** top-level response models: fqcn -> TS name, grouped by section for readability */
const TOP: Record<string, Record<string, string>> = {
    "공통": {"com.dcinside.app.model.g0": "ApiResult"},
    "인증": {"com.dcinside.app.realm.J": "LoginResult"},
    "게시글": {
        "com.dcinside.app.response.j": "ArticleListResponse",
        "com.dcinside.app.model.U": "ArticleViewResponse",
        "com.dcinside.app.model.PostImage": "ArticleImage",
        "com.dcinside.app.model.PostModify": "ArticleModifyInfo",
        "com.dcinside.app.response.i": "ArticleDeleteResult",
        "com.dcinside.app.model.F": "ArticleVoteResult",
        "com.dcinside.app.model.RelationData": "RelatedGalleryArticles",
        "com.dcinside.app.model.S": "OgLink",
        "com.dcinside.app.model.j0": "ArticleTransferResult",
        "com.dcinside.app.model.e0": "PollFinishResult"
    },
    "댓글": {
        "com.dcinside.app.response.n": "CommentListResponse",
        "com.dcinside.app.model.W": "CommentSearchResponse"
    },
    "갤러리": {
        "com.dcinside.app.model.MinorInfo": "GalleryIntro",
        "com.dcinside.app.model.D": "PersonGalleryProfile",
        "com.dcinside.app.model.m0": "UserGallogCount",
        "com.dcinside.app.recent.C3394l": "GalleryRankInfo",
        "com.dcinside.app.model.MajorRanking": "MajorGalleryRanking",
        "com.dcinside.app.model.MinorRanking": "MinorGalleryRanking",
        "com.dcinside.app.model.E": "RecommendArticle",
        "com.dcinside.app.model.H": "MainContent",
        "com.dcinside.app.model.G": "LiveBestArticle",
        "com.dcinside.app.gallery.b": "GalleryCategory",
        "com.dcinside.app.gallery.c": "GalleryNameEntry",
        "com.dcinside.app.response.k": "PumGalleryInfo",
        "com.dcinside.app.response.l": "PumHistory"
    },
    "관리": {
        "com.dcinside.app.gallery.history.c": "ManageHistoryResponse",
        "com.dcinside.app.response.g": "ManagerInfo",
        "com.dcinside.app.response.f": "ManagerEntrustResult",
        "com.dcinside.app.model.J": "ManagerAppointResult",
        "com.dcinside.app.model.P": "ManagerActionResult"
    },
    "검색": {"com.dcinside.app.totalsearch.a": "SearchResponse"},
    "알림": {
        "T.d": "AlarmMessageList",
        "T.e": "ArticleAlarmConfig",
        "T.f": "KeywordAlarmSubscriptions",
        "T.f.c": "AlarmSubscriptions",
        "com.dcinside.app.model.Y": "AlarmSetting",
        "com.dcinside.app.model.N": "MinorNotificationResponse"
    },
    "사용자": {
        "com.dcinside.app.model.C": "MyGalleryResponse",
        "com.dcinside.app.response.e": "ManagedGallery",
        "com.dcinside.app.response.h": "JoinedMiniGalleries",
        "com.dcinside.app.response.c": "MiniGalleryJoinResponse",
        "com.dcinside.app.response.d": "MiniGalleryJoinConfirmResult",
        "com.dcinside.app.model.C2682n": "HitconSettingResult",
        "com.dcinside.app.response.p": "ScrapFolderList",
        "com.dcinside.app.response.s": "ScrapFolderResult",
        "com.dcinside.app.response.r": "ScrapShareResult",
        "com.dcinside.app.response.q": "ScrapShareMultiResult"
    },
    "디시콘": {
        "com.dcinside.app.model.C2688u": "DCConListResponse",
        "com.dcinside.app.model.C2687t": "DCConItem",
        "com.dcinside.app.model.C2685q": "DCConPackageDetail",
        "com.dcinside.app.model.C2692y": "DCConBuyResult",
        "com.dcinside.app.model.C2691x": "DCConInsertResult",
        "com.dcinside.app.response.b": "DCConSettingList",
        "com.dcinside.app.model.BigDcconResult": "BigDCConResult",
        "com.dcinside.app.model.A": "DCConFolderResult",
        "com.dcinside.app.model.C2686s": "DCConFolderList"
    },
    "업로드": {
        "com.dcinside.app.model.VideoUploadResult": "VideoUploadResult",
        "com.dcinside.app.model.VideoInfoUploadResult": "VideoInfoResult",
        "com.dcinside.app.model.n0": "VoiceDownloadResult"
    },
    "자동짤": {
        "X.a": "AutoImageList",
        "X.b": "AutoImageSettingResult",
        "X.d": "AutoImageGalleryList",
        "X.e": "AutoImageUploadResult"
    },
    "AI 이미지": {
        "com.dcinside.app.model.AiImageStatusResult": "AiImageStatus",
        "com.dcinside.app.model.C2675g": "AiImageInsertResult",
        "com.dcinside.app.model.C2679k": "AiPromptListResult",
        "com.dcinside.app.model.C2681m": "AiResampleResult",
        "com.dcinside.app.model.C2680l": "AiFillPromptsResult",
        "com.dcinside.app.write.menu.ai.type.b": "AiCharacterPromptResult"
    },
    "앱": {
        "com.dcinside.app.model.C2669a": "AppCheck",
        "com.dcinside.app.model.l0": "AppUpdateNotice",
        "com.dcinside.app.model.Q": "AppNotice"
    }
};

const cache = new Map<string, string>();
// gson 어노테이션을 import해 `@c(`로 쓴 파일도 같은 정규식으로 읽도록 전체 이름으로 바꿉니다.
const normalize = (src: string) => /^import com\.google\.gson\.annotations\.c;/m.test(src) ? src.replace(/@c\(/g, "@com.google.gson.annotations.c(") : src;
const read = (p: string) => cache.get(p) ?? (cache.set(p, normalize(readFileSync(p, "utf8"))), cache.get(p)!);

function locate(fqcn: string) {
    const parts = fqcn.split(".");
    for (let i = parts.length; i > 0; i--) {
        const path = `${root}/${parts.slice(0, i).join("/")}.java`;
        if (!existsSync(path)) continue;
        const src = read(path);
        let body = src, kind = "class", decl = "";
        for (const inner of parts.slice(i - 1)) {
            // pick the declaration at the shallowest brace depth (direct child, not a deeper nested class)
            const re = new RegExp(String.raw`\b(class|enum|interface) ${inner.replace("$", "\\$")}\b([^{]*)\{`, "g");
            let m: RegExpExecArray | null = null;
            let best = Infinity;
            for (const c of body.matchAll(re)) {
                let depth = 0;
                for (let k = 0; k < c.index!; k++) depth += body[k] === "{" ? 1 : body[k] === "}" ? -1 : 0;
                if (depth < best) [best, m] = [depth, c as RegExpExecArray];
            }
            if (!m) return null;
            kind = m[1]!;
            decl = m[2]!;
            body = block(body, m.index + m[0].length - 1);
        }
        return {body, kind, decl, src};
    }
    return null;
}

function block(text: string, open: number) {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i);
    }
    return text.slice(open + 1);
}

function ownLevel(body: string) {
    let out = "", depth = 0;
    for (const ch of body) {
        if (ch === "{") depth++;
        if (depth === 0) out += ch;
        if (ch === "}") depth--;
    }
    return out;
}

/** jadx가 `NotificationCompat.f27181G0`, `extends AbstractC6879d1`처럼 import한 단순 이름을 쓰면 import에서 전체 이름을 찾습니다. */
function qualify(name: string, owner: string, src = locate(owner)?.src ?? "") {
    const [head, ...rest] = name.split(".");
    const imported = new RegExp(String.raw`^import ([\w.]+\.${head});`, "m").exec(src)?.[1];
    if (imported) return [imported, ...rest].join(".");
    if (name.includes(".")) return name;
    // 자바처럼 자기 내부 클래스 → 바깥 클래스의 내부 클래스 → 같은 패키지 순으로 찾습니다.
    const parts = owner.split(".");
    for (let i = parts.length; i > 0; i--) {
        const candidate = `${parts.slice(0, i).join(".")}.${name}`;
        if (locate(candidate) || existsSync(`${root}/${parts.slice(0, i).join("/")}`)) return candidate;
    }
    return name;
}

function resolveConst(expr: string, owner: string, src: string): string {
    expr = expr.trim();
    if (expr.startsWith("\"")) return JSON.parse(expr);
    const i = expr.lastIndexOf(".");
    const loc = locate(qualify(expr.slice(0, i), owner, src));
    const m = loc && new RegExp(String.raw`\b${expr.slice(i + 1)} = ("(?:[^"\\]|\\.)*")`).exec(loc.body);
    if (!m) throw new Error(`unresolved const ${expr}`);
    return JSON.parse(m[1]!);
}

const names = new Map<string, string>();
const used = new Set<string>();
const sections = new Map<string, string[]>();
let currentSection = "";
const readable = (simple: string) => simple.length > 3 && !/^C\d+[a-z]?$/.test(simple) && /^[A-Z]/.test(simple);
const pascal = (s: string) => s.replace(/(^|[_\-\s]+)([a-z0-9])/gi, (_, __, c: string) => c.toUpperCase());
const unique = (n: string) => {
    let name = n, i = 2;
    while (used.has(name)) name = `${n}${i++}`;
    used.add(name);
    return name;
};

/**
 * 자바 필드 타입을 [TS 타입, 런타임 스펙]으로 바꿉니다.
 * 스펙: s=문자열, i=int(앱 IntTypeAdapter 규칙), n=그 밖의 숫자, b=불리언, ?=모름,
 * 모델 이름, "스펙[]"=배열, "{스펙}"=문자열 키 맵
 */
function tsType(javaType: string, owner: string, hint: string): [string, string] {
    const t = javaType.replace(/java\.(lang|util)\./g, "").trim();
    if (/^(String|CharSequence)$/.test(t)) return ["string", "s"];
    if (/^(int|Integer)$/.test(t)) return ["number", "i"];
    if (/^(long|Long|double|Double|float|Float|short|Short|byte)$/.test(t)) return ["number", "n"];
    if (/^(boolean|Boolean)$/.test(t)) return ["boolean", "b"];
    const arr = /^(?:List|ArrayList|Collection|Set|HashSet|LinkedList)<(?:\? extends )?(.+)>$/.exec(t) ?? /^(.+)\[\]$/.exec(t);
    if (arr) {
        const [ts, spec] = tsType(arr[1]!, owner, hint.replace(/(_list|List|s)$/, "") || hint);
        return [`${wrap(ts)}[]`, `${spec}[]`];
    }
    const map = /^(?:Map|HashMap|LinkedHashMap)<String, ?(.+)>$/.exec(t);
    if (map) {
        const [ts, spec] = tsType(map[1]!, owner, hint);
        return [`Record<string, ${ts}>`, `{${spec}}`];
    }
    if (/^(Object|com\.google\.gson\.\w+|org\.json\.\w+)$/.test(t)) return ["unknown", "?"];
    const name = emit(qualify(t, owner), hint);
    return [name, enums.has(name) ? "s" : name];
}
const wrap = (t: string) => (t.includes("|") ? `(${t})` : t);

const done = new Set<string>();
const enums = new Set<string>();
const schema = new Map<string, Record<string, string>>();
function emit(fqcn: string, hint: string, top?: string): string {
    if (done.has(fqcn)) return names.get(fqcn)!;
    done.add(fqcn);
    if (names.has(fqcn)) top = names.get(fqcn);
    const loc = locate(fqcn);
    if (!loc) throw new Error(`cannot locate ${fqcn}`);
    const simple = fqcn.split(".").pop()!;
    const name = top ?? unique(readable(simple) ? simple : hint);
    names.set(fqcn, name);
    const lines: string[] = [];
    if (loc.kind === "enum") {
        const vals = [...ownLevel(loc.body).matchAll(/(?:@com\.google\.gson\.annotations\.c\(("[^"]*")\)\s*)?\n\s*([A-Z_0-9]+)\(("[^"]*")?/g)]
            .map((v) => JSON.stringify(v[1] ? JSON.parse(v[1]) : v[3] ? JSON.parse(v[3]) : v[2]));
        enums.add(name);
        push(`/** 앱 모델 \`${fqcn}\` */\nexport type ${name} = ${vals.length ? vals.join(" | ") : "string"};`);
        return name;
    }
    const own = ownLevel(loc.body);
    const fieldRe = /@com\.google\.gson\.annotations\.c\((?:alternate = (?:\{[^}]*\})?, )?(?:value = )?([^,)]+)[^)]*\)\s*(?:@[\w.]+(?:\([^)]*\))?\s*)*(?:(?:private|public|protected|final|transient|volatile)\s+)*([\w.$<>, ?\[\]]+?)\s+(\w+)\s*(?:=[^;]*)?;/g;
    const pending: [string, string][] = [];
    for (const m of own.matchAll(fieldRe)) pending.push([resolveConst(m[1]!, fqcn, loc.src), m[2]!]);
    const rawExt = /\bextends ([\w.$]+)/.exec(loc.decl)?.[1];
    const ext = rawExt && qualify(rawExt, fqcn, loc.src);
    let parent = "";
    const fields: Record<string, string> = {};
    if (ext && !/^(java|android|kotlin|io\.realm|androidx)\./.test(ext)) {
        const [p] = tsType(ext, fqcn, `${name}Base`);
        if (p !== "unknown") {
            parent = ` extends ${p}`;
            Object.assign(fields, schema.get(p));
        }
    }
    for (const [key, type] of pending) {
        const prop = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
        const [ts, spec] = tsType(type, fqcn, name + pascal(key));
        lines.push(`    ${prop}?: ${ts};`);
        fields[key] = spec;
    }
    schema.set(name, fields);
    push(`/** 앱 모델 \`${fqcn}\` */\nexport interface ${name}${parent} {\n${lines.join("\n")}${lines.length ? "\n" : ""}}`);
    return name;
}

function push(decl: string) {
    sections.get(currentSection)!.push(decl);
}

for (const [section, entries] of Object.entries(TOP)) {
    currentSection = section;
    sections.set(section, []);
    for (const [fqcn, name] of Object.entries(entries)) { used.add(name); names.set(fqcn, name); }
}
// 내부 모델 이름은 첫 필드에서 지어서 필드 순서가 바뀌면 달라집니다. 이미 공개한 이름은 여기서 고정합니다.
for (const [fqcn, name] of Object.entries({"com.dcinside.app.model.B": "MyGalleryResponseMygall"})) { used.add(name); names.set(fqcn, name); }
for (const [section, entries] of Object.entries(TOP)) {
    currentSection = section;
    for (const [fqcn, name] of Object.entries(entries)) emit(fqcn, name, name);
}

let out = `// 이 파일은 디시인사이드 공식 앱 ${APP.versionName}(${APP.versionCode})의 Gson 응답 모델에서 생성했습니다.
// 서버가 내려주는 키 이름을 그대로 쓰며, 모든 필드는 서버 사정에 따라 빠질 수 있어 optional입니다.
`;
for (const [section, decls] of sections) {
    if (!decls.length) continue;
    out += `\n// ── ${section} ${"─".repeat(Math.max(0, 70 - section.length))}\n\n${decls.join("\n\n")}\n`;
}
const topNames = Object.values(TOP).flatMap((entries) => Object.values(entries));
out += `\n/** \`Http\`의 \`as\` 옵션에 쓰는 응답 이름과 타입입니다. */\nexport interface ResponseMap {\n${topNames.map((n) => `    ${n}: ${n};`).join("\n")}\n}\n`;
writeFileSync(`${outDir}/responses.ts`, out);

// 모델 이름 → {키: 스펙}. JSON이라 선언 파일(.d.ts)에 값이 실리지 않습니다. diff가 보기 좋게 모델당 한 줄입니다.
const lines = [...schema].sort(([a], [b]) => a.localeCompare(b)).map(([name, fields]) => `${JSON.stringify(name)}:${JSON.stringify(fields)}`);
writeFileSync(`${outDir}/schema.json`, `{\n${lines.join(",\n")}\n}\n`);
console.log(`${[...sections.values()].flat().length} declarations`);
