import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectMock, insertMock, requireMembershipMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	insertMock: vi.fn(),
	requireMembershipMock: vi.fn()
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
		insert: () => ({
			values: insertMock
		})
	})
}));

vi.mock('$lib/server/auth/authorization', () => ({
	requireMembership: requireMembershipMock
}));

import { createReply, ReplyNotFoundError } from './create';

describe('createReply', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('requires membership', async () => {
		requireMembershipMock.mockRejectedValueOnce(new Error('Membership required'));

		await expect(
			createReply({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				input: { body: 'Hello' }
			})
		).rejects.toThrow('Membership required');
	});

	it('rejects an empty reply', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		await expect(
			createReply({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				input: { body: '' }
			})
		).rejects.toThrow('Reply is required');

		expect(selectMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
	});

	it('rejects replies to hidden posts', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		selectMock.mockResolvedValueOnce([]);

		await expect(
			createReply({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'hidden-post',
				input: { body: 'Hello' }
			})
		).rejects.toBeInstanceOf(ReplyNotFoundError);

		expect(insertMock).not.toHaveBeenCalled();
	});

	it('creates a reply using the authenticated user', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				hiddenAt: null
			}
		]);

		insertMock.mockResolvedValueOnce(undefined);

		const result = await createReply({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1',
			input: {
				body: 'Hello'
			}
		});

		expect(result).toEqual(
			expect.objectContaining({
				postId: 'post-1',
				authorId: 'user-1',
				body: 'Hello'
			})
		);

		expect(insertMock).toHaveBeenCalledWith(
			expect.objectContaining({
				postId: 'post-1',
				authorId: 'user-1',
				body: 'Hello'
			})
		);
	});
});
