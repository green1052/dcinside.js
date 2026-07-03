import {describe, expect, test} from "bun:test";
import {TextEncoder} from "util";
import {createAndroidCheckinRequest, parseAndroidCheckinResponse} from "../src/core/auth/checkin";

function fixed64Field(fieldNumber: number, value: bigint): Uint8Array {
    const output = new Uint8Array(9);
    output[0] = (fieldNumber << 3) | 1;
    for (let index = 0; index < 8; index++) {
        output[index + 1] = Number((value >> BigInt(index * 8)) & 0xffn);
    }
    return output;
}

describe("Android checkin protobuf helpers", () => {
    test("creates a non-empty checkin request", () => {
        const request = createAndroidCheckinRequest();

        expect(request).toBeInstanceOf(Uint8Array);
        expect(request.byteLength).toBeGreaterThan(80);
    });

    test("includes the current samsung SM-S928N build fingerprint in the request", () => {
        const request = createAndroidCheckinRequest();
        const text = new TextEncoder();
        const fingerprint = text.encode("samsung/e2sxxx/e2s:16/BP4A.251205.006/S928NKSU5AYE1:user/release-keys");
        const found = request.byteLength >= fingerprint.byteLength
            && request.some((_, i) =>
                fingerprint.every((b, j) => request[i + j] === b)
            );

        expect(found).toBe(true);
    });

    test("parses androidId and securityToken fixed64 fields", () => {
        const androidId = 0x0102_0304_0506_0708n;
        const securityToken = 0x1112_1314_1516_1718n;
        const response = new Uint8Array([
            ...fixed64Field(7, androidId),
            ...fixed64Field(8, securityToken)
        ]);

        expect(parseAndroidCheckinResponse(response)).toEqual({
            androidId,
            securityToken
        });
    });

    test("throws when required checkin credentials are missing", () => {
        expect(() => parseAndroidCheckinResponse(new Uint8Array())).toThrow("androidId/securityToken");
    });

    test("parses checkin response with extra unknown fields", () => {
        const androidId = 0x0102_0304_0506_0708n;
        const securityToken = 0x1112_1314_1516_1718n;
        const unknownVarint = new Uint8Array([(1 << 3) | 0, 42]);  // field 1, varint 42
        const response = new Uint8Array([
            ...unknownVarint,
            ...fixed64Field(7, androidId),
            ...fixed64Field(8, securityToken)
        ]);

        expect(parseAndroidCheckinResponse(response)).toEqual({
            androidId,
            securityToken
        });
    });
});
