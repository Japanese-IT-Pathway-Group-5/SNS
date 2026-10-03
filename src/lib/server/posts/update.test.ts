import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_POST_LENGTH } from '$lib/validation/posts';

const { selectMock, updateMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	updateMock: vi.fn()
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
		})
	})
}));

import { PostForbiddenError, PostNotFoundError, PostValidationError, updatePost } from './update';

describe('updatePost', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects update exceeding maximum character length', async () => {
		await expect(
			updatePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				input: {
					body: 'a'.repeat(MAX_POST_LENGTH + 1)
				}
			})
		).rejects.toThrow(PostValidationError);

		expect(selectMock).not.toHaveBeenCalled();
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('rejects empty postId', async () => {
		await expect(
			updatePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: '   ',
				input: {
					body: 'Valid content'
				}
			})
		).rejects.toThrow(PostValidationError);
	});

	it('throws PostNotFoundError when post does not exist', async () => {
		selectMock.mockResolvedValueOnce([]);

		await expect(
			updatePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				input: {
					body: 'New content'
				}
			})
		).rejects.toThrow(PostNotFoundError);
	});

	it('throws PostNotFoundError when post is hidden', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-1',
				submissionId: 'sub-1',
				body: 'Old content',
				mediaId: null,
				hiddenAt: new Date('2026-09-01T00:00:00Z'),
				createdAt: new Date('2026-09-01T00:00:00Z'),
				updatedAt: new Date('2026-09-01T00:00:00Z')
			}
		]);

		await expect(
			updatePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				input: {
					body: 'New content'
				}
			})
		).rejects.toThrow(PostNotFoundError);
	});

	it('throws PostForbiddenError when user is not the author', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-different',
				submissionId: 'sub-1',
				body: 'Old content',
				mediaId: null,
				hiddenAt: null,
				createdAt: new Date('2026-09-01T00:00:00Z'),
				updatedAt: new Date('2026-09-01T00:00:00Z')
			}
		]);

		await expect(
			updatePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				input: {
					body: 'New content'
				}
			})
		).rejects.toThrow(PostForbiddenError);

		expect(updateMock).not.toHaveBeenCalled();
	});

	it('rejects empty text on text-only post', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-1',
				submissionId: 'sub-1',
				body: 'Old content',
				mediaId: null,
				hiddenAt: null,
				createdAt: new Date('2026-09-01T00:00:00Z'),
				updatedAt: new Date('2026-09-01T00:00:00Z')
			}
		]);

		await expect(
			updatePost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				input: {
					body: '   '
				}
			})
		).rejects.toThrow('Post requires text or an image');

		expect(updateMock).not.toHaveBeenCalled();
	});

	it('allows empty text when post has media attached', async () => {
		const createdAt = new Date('2026-09-01T00:00:00Z');
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-1',
				submissionId: 'sub-1',
				body: 'Old content with image',
				mediaId: 'images/img-1',
				hiddenAt: null,
				createdAt,
				updatedAt: createdAt
			}
		]);
		updateMock.mockResolvedValueOnce(undefined);

		const result = await updatePost({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1',
			input: {
				body: ''
			}
		});

		expect(result).toEqual({
			id: 'post-1',
			authorId: 'user-1',
			submissionId: 'sub-1',
			body: '',
			mediaId: 'images/img-1',
			createdAt,
			updatedAt: expect.any(Date)
		});
		expect(updateMock).toHaveBeenCalled();
	});

	it('successfully updates post text for the author', async () => {
		const createdAt = new Date('2026-09-01T00:00:00Z');
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-1',
				submissionId: 'sub-1',
				body: 'Old text',
				mediaId: null,
				hiddenAt: null,
				createdAt,
				updatedAt: createdAt
			}
		]);
		updateMock.mockResolvedValueOnce(undefined);

		const result = await updatePost({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1',
			input: {
				body: 'Updated text content'
			}
		});

		expect(result).toEqual({
			id: 'post-1',
			authorId: 'user-1',
			submissionId: 'sub-1',
			body: 'Updated text content',
			mediaId: null,
			createdAt,
			updatedAt: expect.any(Date)
		});
		expect(updateMock).toHaveBeenCalled();
	});
});
