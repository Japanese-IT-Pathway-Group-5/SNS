import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { R2Storage } from '$lib/server/storage/r2';

const { selectMock, updateMock, deleteMock, cleanupUploadedPhotoMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	updateMock: vi.fn(),
	deleteMock: vi.fn(),
	cleanupUploadedPhotoMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => selectMock()
				})
			})
		}),
		update: () => ({
			set: () => ({
				where: updateMock
			})
		}),
		delete: () => ({
			where: deleteMock
		})
	})
}));

vi.mock('$lib/server/storage/photo-cleanup', () => ({
	cleanupUploadedPhoto: cleanupUploadedPhotoMock
}));

import { deletePost, PostForbiddenError, PostNotFoundError, PostValidationError } from './delete';

describe('deletePost', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects empty postId', async () => {
		await expect(
			deletePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: '   '
			})
		).rejects.toThrow(PostValidationError);
	});

	it('throws PostNotFoundError when post does not exist', async () => {
		selectMock.mockResolvedValueOnce([]);

		await expect(
			deletePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1'
			})
		).rejects.toThrow(PostNotFoundError);

		expect(deleteMock).not.toHaveBeenCalled();
	});

	it('throws PostForbiddenError when user is not the author', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'other-user',
				mediaId: null
			}
		]);

		await expect(
			deletePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1'
			})
		).rejects.toThrow(PostForbiddenError);

		expect(deleteMock).not.toHaveBeenCalled();
	});

	it('successfully deletes a text-only post and its replies', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-1',
				mediaId: null
			}
		]);
		deleteMock.mockResolvedValue(undefined);

		const result = await deletePost({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1'
		});

		expect(result).toEqual({
			id: 'post-1',
			success: true
		});
		// Should have deleted reply and post
		expect(deleteMock).toHaveBeenCalledTimes(2);
		expect(cleanupUploadedPhotoMock).not.toHaveBeenCalled();
	});

	it('handles post with media: sets cleanup status, removes from storage and deletes media record', async () => {
		// Post select
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-1',
				mediaId: 'media-1'
			}
		]);
		// Media select
		selectMock.mockResolvedValueOnce([
			{
				id: 'media-1',
				objectKey: 'images/img-123',
				status: 'ready'
			}
		]);
		updateMock.mockResolvedValueOnce(undefined);
		deleteMock.mockResolvedValue(undefined);
		cleanupUploadedPhotoMock.mockResolvedValueOnce(undefined);

		const fakeBucket = {} as R2Storage;

		const result = await deletePost({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1',
			mediaBucket: fakeBucket
		});

		expect(result).toEqual({
			id: 'post-1',
			success: true
		});
		expect(updateMock).toHaveBeenCalled();
		expect(cleanupUploadedPhotoMock).toHaveBeenCalledWith(fakeBucket, 'images/img-123');
		// Deletes reply, post, and media
		expect(deleteMock).toHaveBeenCalledTimes(3);
	});

	it('preserves deletion success even if physical storage cleanup fails', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-1',
				mediaId: 'media-1'
			}
		]);
		selectMock.mockResolvedValueOnce([
			{
				id: 'media-1',
				objectKey: 'images/img-123',
				status: 'ready'
			}
		]);
		updateMock.mockResolvedValueOnce(undefined);
		deleteMock.mockResolvedValue(undefined);
		cleanupUploadedPhotoMock.mockRejectedValueOnce(new Error('R2 unavailable'));

		const fakeBucket = {} as R2Storage;

		const result = await deletePost({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1',
			mediaBucket: fakeBucket
		});

		expect(result).toEqual({
			id: 'post-1',
			success: true
		});
		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to clean up post image from storage:',
			expect.any(Error)
		);
		consoleSpy.mockRestore();
	});
});
