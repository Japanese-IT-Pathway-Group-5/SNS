import type { DetectedImageType } from './image-signature';
import { putObject, type R2Storage } from './r2';

export async function uploadPhoto(
	bucket: R2Storage,
	file: File,
	contentType: DetectedImageType
): Promise<string> {
	const imageKey = `images/${crypto.randomUUID()}`;

	const buffer = await file.arrayBuffer();
	await putObject(bucket, imageKey, buffer, contentType);

	return imageKey;
}
