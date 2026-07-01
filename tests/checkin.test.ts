import {describe, expect, test} from "bun:test";
import {createAndroidCheckinRequest, parseAndroidCheckinResponse} from "../src/auth/checkin";

function fixed64Field(fieldNumber: number, value: bigint): Uint8Array {
    const output = new Uint8Array(9);
    output[0] = (fieldNumber << 3) | 1;
    for (let index = 0; index < 8; index++) {
        output[index + 1] = Number((value >> BigInt(index * 8)) & 0xffn);
    }
    return output;
}

describe("Android checkin protobuf helpers", () => {
    test("creates a non-empty checkin request with deterministic locale/timezone fields", () => {
        const request = createAndroidCheckinRequest();

        expect(request).toBeInstanceOf(Uint8Array);
        expect(request.byteLength).toBeGreaterThan(80);
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
});