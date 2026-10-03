import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }));

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({
			from: () => ({
				innerJoin: () => ({
					where: () => ({
						limit: () => selectMock()
					})
				})
			})
		})
	})
}));

import { getPost, PostNotFoundError } from './get';

describe('getPost', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('does not return a hidden or missing post', async () => {
		selectMock.mockResolvedValueOnce([]);

		await expect(
			getPost({
				d1: {} as D1Database,
				postId: 'hidden-post'
			})
		).rejects.toBeInstanceOf(PostNotFoundError);
	});

	it('returns a visible post', async () => {
		const createdAt = new Date('2026-09-01T00:00:00.000Z');

		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-2',
				authorName: 'Aiko',
				authorImage: null,
				submissionId: 'sub-1',
				body: 'Hello',
				mediaId: null,
				createdAt
			}
		]);

		const result = await getPost({
			d1: {} as D1Database,
			postId: 'post-1'
		});

		expect(result).toEqual({
			id: 'post-1',
			authorId: 'user-2',
			authorName: 'Aiko',
			authorImage: null,
			submissionId: 'sub-1',
			body: 'Hello',
			mediaId: null,
			createdAt
		});
	});
});
