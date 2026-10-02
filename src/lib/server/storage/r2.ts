export interface R2Storage {
	put(
		key: string,
		value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
		options?: R2PutOptions
	): Promise<R2Object>;

	get(key: string): Promise<unknown>;

	delete(key: string): Promise<void>;
}

export async function putObject(
	bucket: R2Storage,
	key: string,
	value: ReadableStream,
	contentType: string
): Promise<void> {
	await bucket.put(key, value, {
		httpMetadata: {
			contentType
		}
	});
}

export async function deleteObject(bucket: R2Storage, key: string): Promise<void> {
	await bucket.delete(key);
}
