export type JsonObject = Record<string, unknown>;

export function objectValue(value: unknown): JsonObject {
    return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

export function arrayValue(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value);
    return [];
}

export function firstObject(value: unknown): JsonObject {
    if (Array.isArray(value)) return objectValue(value[0]);

    const object = objectValue(value);
    const numericKey = Object.keys(object)
        .filter((key) => /^\d+$/.test(key))
        .sort((left, right) => Number(left) - Number(right))[0];

    return numericKey && object[numericKey] && typeof object[numericKey] === "object"
        ? objectValue(object[numericKey])
        : object;
}

export function stringValue(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : value == null ? fallback : String(value);
}

export function nullableString(value: unknown): string | null {
    if (value == null || value === "") return null;
    return stringValue(value);
}

export function numberValue(value: unknown, fallback = 0): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

export function nullableNumber(value: unknown): number | null {
    if (value == null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

export function booleanValue(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value !== "string") return false;

    const normalized = value.toLowerCase();
    return normalized === "true" || normalized === "y" || normalized === "1";
}

export function ynBoolean(value: unknown): boolean {
    return value === true || value === "Y" || value === "y" || value === "1" || value === 1;
}

export function nullableYnBoolean(value: unknown): boolean | null {
    if (value == null || value === "") return null;
    return ynBoolean(value);
}

export function nullableBoolean(value: unknown): boolean | null {
    if (value == null || value === "") return null;
    return booleanValue(value);
}