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

const deleteInput = (overrides: Partial<Parameters<typeof deleteReply>[0]> = {}) => ({
	d1: {} as D1Database,
	userId: 'user-1',
	postId: 'post-1',
	replyId: 'reply-1',
	...overrides
});

describe('deleteReply', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects a missing reply', async () => {
		selectMock.mockResolvedValueOnce([]);

		await expect(
			deleteReply(
				deleteInput({
					replyId: 'missing'
				})
			)
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

		await expect(deleteReply(deleteInput())).rejects.toBeInstanceOf(ReplyForbiddenError);

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

		const result = await deleteReply(deleteInput());

		expect(result).toEqual({
			id: 'reply-1',
			success: true
		});

		expect(updateMock).toHaveBeenCalled();
	});
});
