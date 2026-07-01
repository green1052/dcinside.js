import {DCInsideError} from "./errors";
import {booleanValue, nullableString, objectValue} from "./json";

export function isApiError(value: unknown): boolean {
    const object = objectValue(value);
    return "result" in object && ("cause" in object || "refresh_join" in object) && !booleanValue(object["result"]);
}

export function shouldRefreshAppId(value: unknown): boolean {
    return booleanValue(objectValue(value)["refresh_join"]);
}

export function apiError(action: string, value: unknown): DCInsideError {
    const object = objectValue(value);
    const cause = nullableString(object["cause"]) ?? "unknown error";
    return new DCInsideError(`Unable to ${action}: ${cause}`);
}