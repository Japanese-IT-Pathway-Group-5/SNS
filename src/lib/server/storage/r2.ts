export interface R2Storage {
        put(
                key: string,
                value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
                options?: R2PutOptions
        ): Promise<R2Object>;

        get(key: string): Promise<R2ObjectBody | null>;

        delete(key: string): Promise<void>;
}

export type R2PutValue = ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob;

export async function putObject(
        bucket: R2Storage,
        key: string,
        value: R2PutValue,
        contentType: string
): Promise<void> {
        await bucket.put(key, value, {
                httpMetadata: {
                        contentType
                }
        });
}

export async function getObject(
        bucket: R2Storage,
        key: string
): Promise<R2ObjectBody | null> {
        return bucket.get(key);
}

export async function deleteObject(bucket: R2Storage, key: string): Promise<void> {
        await bucket.delete(key);
}
