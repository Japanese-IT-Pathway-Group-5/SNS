import { describe, expect, it, vi } from 'vitest';
import { cleanupUploadedPhoto } from './photo-cleanup';

describe('cleanupUploadedPhoto', () => {
	it('deletes the uploaded photo', async () => {
		const bucket = {
			put: vi.fn(),
			get: vi.fn(),
			delete: vi.fn().mockResolvedValue(undefined)
		};

		await cleanupUploadedPhoto(bucket, 'images/test-image');

		expect(bucket.delete).toHaveBeenCalledTimes(1);
		expect(bucket.delete).toHaveBeenCalledWith('images/test-image');
	});

	it('retries when deletion fails', async () => {
		const bucket = {
			put: vi.fn(),
			get: vi.fn(),
			delete: vi
				.fn()
				.mockRejectedValueOnce(new Error('temporary R2 failure'))
				.mockResolvedValueOnce(undefined)
		};

		const sleep = vi.fn().mockResolvedValue(undefined);

		await cleanupUploadedPhoto(bucket, 'images/test-image', {
			maxAttempts: 3,
			retryDelayMs: 10,
			sleep
		});

		expect(bucket.delete).toHaveBeenCalledTimes(2);
		expect(sleep).toHaveBeenCalledTimes(1);
		expect(sleep).toHaveBeenCalledWith(10);
	});

	it('throws after all cleanup attempts fail', async () => {
		const error = new Error('R2 unavailable');

		const bucket = {
			put: vi.fn(),
			get: vi.fn(),
			delete: vi.fn().mockRejectedValue(error)
		};

		const sleep = vi.fn().mockResolvedValue(undefined);

		await expect(
			cleanupUploadedPhoto(bucket, 'images/test-image', {
				maxAttempts: 3,
				retryDelayMs: 10,
				sleep
			})
		).rejects.toThrow('R2 unavailable');

		expect(bucket.delete).toHaveBeenCalledTimes(3);
		expect(sleep).toHaveBeenCalledTimes(2);
	});
});
