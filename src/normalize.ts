import SCHEMA from "./types/schema.json";

/**
 * 응답 값을 앱 Gson 모델 타입에 맞춥니다. 서버는 같은 필드를 `"12"`/`12`/`true`처럼 섞어 보내고
 * 앱은 Gson이 읽으면서 바꿔 씁니다. 같은 규칙을 적용해 TS 타입과 실제 값이 일치하게 합니다.
 *
 * - `s` 문자열: 숫자/불리언은 문자열로 바꿉니다.
 * - `i` int: 앱 `IntTypeAdapter`처럼 `null`/`""`은 0, 불리언은 1/0, 숫자 문자열은 숫자입니다.
 * - `n` 숫자, `b` 불리언(`"true"`/`"1"`/`"Y"`/1은 참)
 * - 모델: 스키마에 없는 키는 그대로 둡니다. 바꿀 수 없는 값은 지웁니다(필드는 모두 optional).
 */
export function normalize(value: unknown, spec: string): unknown {
    if (value === undefined) return undefined;
    switch (spec) {
        case "?":
            return value;
        case "s":
            return value === null || typeof value === "object" ? undefined : String(value);
        case "i": {
            if (value === null || value === "") return 0;
            if (typeof value === "boolean") return value ? 1 : 0;
            const number = Number(value);
            return Number.isFinite(number) ? Math.trunc(number) : undefined;
        }
        case "n": {
            if (value === null || value === "" || typeof value === "boolean") return undefined;
            const number = Number(value);
            return Number.isFinite(number) ? number : undefined;
        }
        case "b":
            if (typeof value === "boolean") return value;
            if (typeof value === "number") return value !== 0;
            if (typeof value === "string") return /^(true|1|y)$/i.test(value.trim());
            return undefined;
    }
    if (spec.endsWith("[]")) {
        const items = Array.isArray(value) ? value : value && typeof value === "object" ? Object.values(value) : [];
        return items.map((item) => normalize(item, spec.slice(0, -2)));
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    const object = value as Record<string, unknown>;
    if (spec.startsWith("{")) {
        const inner = spec.slice(1, -1);
        return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, normalize(item, inner)]));
    }
    const fields = (SCHEMA as Record<string, Record<string, string>>)[spec];
    if (!fields) return object;
    const out: Record<string, unknown> = {...object};
    for (const [key, fieldSpec] of Object.entries(fields)) {
        if (!(key in object)) continue;
        const normalized = normalize(object[key], fieldSpec);
        if (normalized === undefined) delete out[key];
        else out[key] = normalized;
    }
    return out;
}
