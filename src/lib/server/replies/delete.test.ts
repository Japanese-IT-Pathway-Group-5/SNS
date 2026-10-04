import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { deleteReply, ReplyForbiddenError, ReplyNotFoundError } from './delete';

describe('deleteReply', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects a missing reply', async () => {
		selectMock.mockResolvedValueOnce([]);

		await expect(
			deleteReply({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				replyId: 'missing'
			})
		).rejects.toBeInstanceOf(ReplyNotFoundError);

		expect(updateMock).not.toHaveBeenCalled();
	});

	it('rejects deletion by another user', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'reply-1',
				authorId: 'user-2'
			}
		]);

		await expect(
			deleteReply({
				d1: {} as D1Database,
				userId: 'user-1',
				postId: 'post-1',
				replyId: 'reply-1'
			})
		).rejects.toBeInstanceOf(ReplyForbiddenError);

		expect(updateMock).not.toHaveBeenCalled();
	});

	it('soft deletes a reply owned by the authenticated user', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'reply-1',
				authorId: 'user-1'
			}
		]);

		updateMock.mockResolvedValueOnce(undefined);

		const result = await deleteReply({
			d1: {} as D1Database,
			userId: 'user-1',
			postId: 'post-1',
			replyId: 'reply-1'
		});

		expect(result).toEqual({
			id: 'reply-1',
			success: true
		});

		expect(updateMock).toHaveBeenCalled();
	});
});
