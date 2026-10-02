import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectMock, requireMembershipMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	requireMembershipMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => selectMock(),
					orderBy: () => ({
						limit: () => selectMock()
					})
				}),
				innerJoin: () => ({
					where: () => ({
						orderBy: () => ({
							limit: () => selectMock()
						})
					})
				})
			})
		})
	})
}));

vi.mock('$lib/server/auth/authorization', () => ({
	requireMembership: requireMembershipMock
}));

import { listReplies } from './list';

describe('listReplies', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('requires membership', async () => {
		requireMembershipMock.mockRejectedValueOnce(new Error('Membership required'));

		await expect(
			listReplies({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1'
			})
		).rejects.toThrow('Membership required');
	});

	it('returns no replies for a hidden or missing post', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		selectMock.mockResolvedValueOnce([]);

		const result = await listReplies({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'hidden-post'
		});

		expect(result).toEqual({
			items: [],
			nextCursor: null
		});
	});

	it('returns visible replies with a stable cursor', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		const createdAt = new Date('2026-09-01T00:00:00.000Z');

		selectMock
			.mockResolvedValueOnce([
				{
					id: 'post-1'
				}
			])
			.mockResolvedValueOnce([
				{
					id: 'reply-1',
					postId: 'post-1',
					authorId: 'user-2',
					authorName: 'Aiko',
					body: 'One',
					createdAt
				},
				{
					id: 'reply-2',
					postId: 'post-1',
					authorId: 'user-3',
					authorName: 'Ben',
					body: 'Two',
					createdAt
				},
				{
					id: 'reply-3',
					postId: 'post-1',
					authorId: 'user-4',
					authorName: 'Kai',
					body: 'Three',
					createdAt
				}
			]);

		const result = await listReplies({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1',
			limit: 2
		});

		expect(result.items).toHaveLength(2);
		expect(result.items[0]?.id).toBe('reply-1');
		expect(result.items[1]?.id).toBe('reply-2');
		expect(result.nextCursor).toEqual({
			createdAt: createdAt.getTime(),
			id: 'reply-2'
		});
	});

	it('returns no cursor on the final page', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		selectMock
			.mockResolvedValueOnce([
				{
					id: 'post-1'
				}
			])
			.mockResolvedValueOnce([
				{
					id: 'reply-1',
					postId: 'post-1',
					authorId: 'user-2',
					authorName: 'Aiko',
					body: 'One',
					createdAt: new Date('2026-09-01T00:00:00.000Z')
				}
			]);

		const result = await listReplies({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1'
		});

		expect(result.items).toHaveLength(1);
		expect(result.nextCursor).toBeNull();
	});
});
