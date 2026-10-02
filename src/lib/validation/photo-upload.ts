import { z } from 'zod';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export const MAX_PHOTO_REQUEST_BYTES = MAX_PHOTO_BYTES + MULTIPART_OVERHEAD_BYTES;

export const photoUploadSchema = z.object({
	file: z.file().min(1).max(MAX_PHOTO_BYTES)
});

export type PhotoUploadResult =
	{ success: true; file: File } | { success: false; error: 'invalid' | 'too_large' };

export function validatePhotoUpload(formData: FormData): PhotoUploadResult {
	const result = photoUploadSchema.safeParse({ file: formData.get('file') });

	if (result.success) {
		return { success: true, file: result.data.file };
	}

	const tooLarge = result.error.issues.some((issue) => issue.code === 'too_big');

	return { success: false, error: tooLarge ? 'too_large' : 'invalid' };
}

export type ContentLengthCheck = 'ok' | 'missing' | 'invalid' | 'too_large';

export function checkUploadContentLength(header: string | null): ContentLengthCheck {
	if (header === null) {
		return 'missing';
	}

	if (!/^\d+$/.test(header)) {
		return 'invalid';
	}

	return Number(header) > MAX_PHOTO_REQUEST_BYTES ? 'too_large' : 'ok';
}
