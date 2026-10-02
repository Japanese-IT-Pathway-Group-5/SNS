import { describe, expect, it, vi } from 'vitest';
import { withPhotoCleanup } from './with-photo-cleanup';

describe('withPhotoCleanup', () => {
	it('keeps the image when post creation succeeds', async () => {
		const bucket = {
			put: vi.fn(),
			delete: vi.fn(),
			get: vi.fn() as any
		} as any;

		const createPost = vi.fn().mockResolvedValue({ id: 'post-1' });

		const result = await withPhotoCleanup(
			{
				bucket,
				imageKey: 'images/test-image'
			},
			createPost
		);

		expect(result).toEqual({ id: 'post-1' });
		expect(createPost).toHaveBeenCalledTimes(1);
		expect(bucket.delete).not.toHaveBeenCalled();
	});

	it('cleans up the image when post creation fails', async () => {
		const bucket = {
			put: vi.fn(),
			delete: vi.fn().mockResolvedValue(undefined),
			get: vi.fn() as any
		} as any;

		const error = new Error('database insert failed');
		const createPost = vi.fn().mockRejectedValue(error);

		await expect(
			withPhotoCleanup(
				{
					bucket,
					imageKey: 'images/test-image'
				},
				createPost
			)
		).rejects.toThrow('database insert failed');

		expect(bucket.delete).toHaveBeenCalledTimes(1);
		expect(bucket.delete).toHaveBeenCalledWith('images/test-image');
	});

	it('does not attempt cleanup when no image was uploaded', async () => {
		const bucket = {
			put: vi.fn(),
			delete: vi.fn(),
			get: vi.fn() as any
		} as any;

		const createPost = vi.fn().mockRejectedValue(new Error('database insert failed'));

		await expect(
			withPhotoCleanup(
				{
					bucket
				},
				createPost
			)
		).rejects.toThrow('database insert failed');

		expect(bucket.delete).not.toHaveBeenCalled();
	});

	it('retries cleanup before returning the original post error', async () => {
		const bucket = {
			put: vi.fn(),
			delete: vi
				.fn()
				.mockRejectedValueOnce(new Error('temporary R2 failure'))
				.mockResolvedValueOnce(undefined),
			get: vi.fn() as any
		} as any;

		const createPost = vi.fn().mockRejectedValue(new Error('database insert failed'));

		await expect(
			withPhotoCleanup(
				{
					bucket,
					imageKey: 'images/test-image',
					cleanup: {
						maxAttempts: 3,
						retryDelayMs: 0
					}
				},
				createPost
			)
		).rejects.toThrow('database insert failed');

		expect(bucket.delete).toHaveBeenCalledTimes(2);
	});

	it('preserves the post error if cleanup ultimately fails', async () => {
		const bucket = {
			put: vi.fn(),
			delete: vi.fn().mockRejectedValue(new Error('R2 unavailable')),
			get: vi.fn() as any
		} as any;

		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const postError = new Error('database insert failed');
		const createPost = vi.fn().mockRejectedValue(postError);

		await expect(
			withPhotoCleanup(
				{
					bucket,
					imageKey: 'images/test-image',
					cleanup: {
						maxAttempts: 2,
						retryDelayMs: 0
					}
				},
				createPost
			)
		).rejects.toThrow('database insert failed');

		expect(bucket.delete).toHaveBeenCalledTimes(2);
		expect(consoleError).toHaveBeenCalled();

		consoleError.mockRestore();
	});
});
