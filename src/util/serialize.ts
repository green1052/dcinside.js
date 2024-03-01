interface SerializedField {
    name: string;
    value: string;
}

export function serialize(fields: SerializedField[]) {
    const result: Record<string, string> = {};

    for (const field of fields) {
        result[field.name] = field.value;
    }

    return result;
}