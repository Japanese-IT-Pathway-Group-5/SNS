import { deleteObject, type R2Storage } from './r2';

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 100;

export interface CleanupOptions {
	maxAttempts?: number;
	retryDelayMs?: number;
	sleep?: (delayMs: number) => Promise<void>;
}

const defaultSleep = (delayMs: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, delayMs));

export async function cleanupUploadedPhoto(
	bucket: R2Storage,
	objectKey: string,
	options: CleanupOptions = {}
): Promise<void> {
	const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
	const retryDelayMs = Math.max(0, options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);
	const sleep = options.sleep ?? defaultSleep;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			await deleteObject(bucket, objectKey);
			return;
		} catch (error) {
			lastError = error;

			if (attempt < maxAttempts) {
				await sleep(retryDelayMs);
			}
		}
	}

	throw lastError instanceof Error ? lastError : new Error('Failed to clean up uploaded photo');
}
