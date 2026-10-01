import { cleanupUploadedPhoto, type CleanupOptions } from './photo-cleanup';
import type { R2Storage } from './r2';

export interface PhotoCleanupContext {
	bucket: R2Storage;
	imageKey?: string;
	cleanup?: CleanupOptions;
}

/**
 * Runs post creation while keeping the uploaded image pending.
 *
 * If post creation succeeds, the image is kept.
 * If post creation fails after an image was uploaded, the image is
 * deleted from R2 with the configured retry policy.
 */
export async function withPhotoCleanup<T>(
	context: PhotoCleanupContext,
	createPost: () => Promise<T>
): Promise<T> {
	try {
		return await createPost();
	} catch (error) {
		if (context.imageKey) {
			try {
				await cleanupUploadedPhoto(context.bucket, context.imageKey, context.cleanup);
			} catch (cleanupError) {
				console.error('Failed to clean up orphaned uploaded photo:', cleanupError);
			}
		}

		throw error;
	}
}
