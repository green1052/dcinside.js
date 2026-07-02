import type {AndroidCheckinCredentials} from "../types";

type Field = Uint8Array;

export function createAndroidCheckinRequest(): Uint8Array {
    const locale = "ko_KR";
    const timeZone = "Asia/Seoul";

    const build = message([
        stringField(1, "samsung/e2sxxx/e2s:16/BP4A.251205.006/S928NKSU5AYE1:user/release-keys"),
        stringField(2, "e2s"),
        boolField(3, false),
        stringField(4, "samsung/e2sxxx/e2s:16/BP4A.251205.006/S928NKSU5AYE1:user/release-keys"),
        stringField(6, "android-google"),
        varintField(7, BigInt(Date.now())),
        stringField(9, "e2s"),
        varintField(10, 36n),
        stringField(11, "SM-S928N"),
        stringField(12, "samsung"),
        stringField(13, "e2s")
    ]);

    const checkin = message([
        bytesField(1, build),
        varintField(2, 0n),
        stringField(8, "WIFI::")
    ]);

    return message([
        varintField(2, 0n),
        bytesField(4, checkin),
        stringField(6, locale),
        varintField(7, BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000))),
        stringField(9, randomHex(12)),
        stringField(10, randomDigits(14)),
        stringField(12, timeZone),
        varintField(14, 3n),
        stringField(15, "71Q6Rn2DDZl1zPDVaaeEHItd"),
        stringField(19, "wifi"),
        varintField(20, 0n),
        varintField(22, 0n)
    ]);
}

export function parseAndroidCheckinResponse(bytes: Uint8Array): AndroidCheckinCredentials {
    const fields = readFields(bytes);
    const androidId = fields.find((field) => field.fieldNumber === 7 && field.wireType === 1);
    const securityToken = fields.find((field) => field.fieldNumber === 8 && field.wireType === 1);

    if (!androidId || !securityToken) {
        throw new Error("Android checkin response did not include androidId/securityToken.");
    }

    return {
        androidId: readFixed64(androidId.data),
        securityToken: readFixed64(securityToken.data)
    };
}

function message(fields: Field[]): Uint8Array {
    return concat(fields);
}

function stringField(fieldNumber: number, value: string): Field {
    return bytesField(fieldNumber, new TextEncoder().encode(value));
}

function boolField(fieldNumber: number, value: boolean): Field {
    return concat([
        writeVarint(BigInt((fieldNumber << 3) | 0)),
        writeVarint(value ? 1n : 0n)
    ]);
}

function bytesField(fieldNumber: number, value: Uint8Array): Field {
    return concat([
        writeVarint(BigInt((fieldNumber << 3) | 2)),
        writeVarint(BigInt(value.byteLength)),
        value
    ]);
}

function varintField(fieldNumber: number, value: bigint): Field {
    return concat([
        writeVarint(BigInt(fieldNumber << 3)),
        writeVarint(value)
    ]);
}

function writeVarint(value: bigint): Uint8Array {
    const bytes: number[] = [];
    let current = value;
    while (current >= 0x80n) {
        bytes.push(Number((current & 0x7fn) | 0x80n));
        current >>= 7n;
    }
    bytes.push(Number(current));
    return new Uint8Array(bytes);
}

function readFields(bytes: Uint8Array): Array<{ fieldNumber: number; wireType: number; data: Uint8Array }> {
    const fields: Array<{ fieldNumber: number; wireType: number; data: Uint8Array }> = [];
    let offset = 0;

    while (offset < bytes.length) {
        const key = readVarint(bytes, offset);
        offset = key.offset;
        const fieldNumber = Number(key.value >> 3n);
        const wireType = Number(key.value & 0x07n);

        if (wireType === 0) {
            const value = readVarint(bytes, offset);
            fields.push({fieldNumber, wireType, data: bytes.slice(offset, value.offset)});
            offset = value.offset;
        } else if (wireType === 1) {
            fields.push({fieldNumber, wireType, data: bytes.slice(offset, offset + 8)});
            offset += 8;
        } else if (wireType === 2) {
            const length = readVarint(bytes, offset);
            offset = length.offset;
            fields.push({fieldNumber, wireType, data: bytes.slice(offset, offset + Number(length.value))});
            offset += Number(length.value);
        } else if (wireType === 5) {
            fields.push({fieldNumber, wireType, data: bytes.slice(offset, offset + 4)});
            offset += 4;
        } else {
            throw new Error(`Unsupported protobuf wire type: ${wireType}`);
        }
    }

    return fields;
}

function readVarint(bytes: Uint8Array, start: number): { value: bigint; offset: number } {
    let result = 0n;
    let shift = 0n;
    let offset = start;

    while (offset < bytes.length) {
        const byte = bytes[offset++]!;
        result |= BigInt(byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7n;
    }

    return {value: result, offset};
}

function readFixed64(bytes: Uint8Array): bigint {
    let value = 0n;
    for (let index = 0; index < 8; index++) {
        value |= BigInt(bytes[index] ?? 0) << BigInt(index * 8);
    }
    return value;
}

function concat(chunks: Uint8Array[]): Uint8Array {
    const size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
    const output = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return output;
}

function randomHex(length: number): string {
    const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, length);
}

function randomDigits(length: number): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, (byte) => String(byte % 10)).join("");
}