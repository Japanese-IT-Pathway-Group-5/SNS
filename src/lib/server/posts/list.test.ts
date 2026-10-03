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

import { listPosts } from './list';

describe('listPosts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('requires membership', async () => {
		requireMembershipMock.mockRejectedValueOnce(new Error('Membership required'));

		await expect(
			listPosts({
				d1: {} as D1Database,
				userId: 'user-1'
			})
		).rejects.toThrow('Membership required');
	});

	it('returns visible posts and a cursor when another page exists', async () => {
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
				body: 'One',
				mediaId: null,
				createdAt
			},
			{
				id: 'post-2',
				authorId: 'user-3',
				authorName: 'Ben',
				submissionId: 'sub-2',
				body: 'Two',
				mediaId: null,
				createdAt
			},
			{
				id: 'post-3',
				authorId: 'user-4',
				authorName: 'Kai',
				submissionId: 'sub-3',
				body: 'Three',
				mediaId: null,
				createdAt
			}
		]);

		const result = await listPosts({
			d1: {} as D1Database,
			userId: 'user-1',
			options: {
				limit: 2
			}
		});

		expect(result.items).toHaveLength(2);
		expect(result.items[0]?.id).toBe('post-1');
		expect(result.items[1]?.id).toBe('post-2');
		expect(result.nextCursor).toEqual({
			createdAt: createdAt.getTime(),
			id: 'post-2'
		});
	});

	it('returns no cursor on the final page', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-2',
				authorName: 'Aiko',
				submissionId: 'sub-1',
				body: 'One',
				mediaId: null,
				createdAt: new Date('2026-09-01T00:00:00.000Z')
			}
		]);

		const result = await listPosts({
			d1: {} as D1Database,
			userId: 'user-1'
		});

		expect(result.items).toHaveLength(1);
		expect(result.nextCursor).toBeNull();
	});
});
