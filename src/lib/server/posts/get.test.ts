import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectMock, requireMembershipMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	requireMembershipMock: vi.fn()
}));

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

vi.mock('$lib/server/auth/authorization', () => ({
	requireMembership: requireMembershipMock
}));

import { getPost, PostNotFoundError } from './get';

describe('getPost', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('requires membership', async () => {
		requireMembershipMock.mockRejectedValueOnce(new Error('Membership required'));

		await expect(
			getPost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1'
			})
		).rejects.toThrow('Membership required');
	});

	it('does not return a hidden or missing post', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		selectMock.mockResolvedValueOnce([]);

		await expect(
			getPost({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'hidden-post'
			})
		).rejects.toBeInstanceOf(PostNotFoundError);
	});

	it('returns a visible post', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		const createdAt = new Date('2026-09-01T00:00:00.000Z');

		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-2',
				authorName: 'Aiko',
				submissionId: 'sub-1',
				body: 'Hello',
				mediaId: null,
				createdAt
			}
		]);

		const result = await getPost({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1'
		});

		expect(result).toEqual({
			id: 'post-1',
			authorId: 'user-2',
			authorName: 'Aiko',
			submissionId: 'sub-1',
			body: 'Hello',
			mediaId: null,
			createdAt
		});
	});
});
