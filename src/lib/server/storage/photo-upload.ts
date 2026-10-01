import { putObject, type R2Storage } from './r2';

export async function uploadPhoto(bucket: R2Storage, file: File): Promise<string> {
	const imageKey = `images/${crypto.randomUUID()}`;

	await putObject(bucket, imageKey, file.stream(), file.type);

	return imageKey;
}
