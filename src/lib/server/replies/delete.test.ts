import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectMock, updateMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	updateMock: vi.fn()
}));

vi.mock('$lib/server/db', () => {
	const query = {
		from: () => query,
		where: () => query,
		limit: () => selectMock()
	};

	return {
		getDb: () => ({
			select: () => query,
			update: () => ({
				set: () => ({
					where: updateMock
				})
			})
		})
	};
});

import { deleteReply, ReplyForbiddenError, ReplyNotFoundError } from './delete';

const deleteInput = (overrides: Partial<Parameters<typeof deleteReply>[0]> = {}) => ({
	d1: {} as D1Database,
	userId: 'user-1',
	postId: 'post-1',
	replyId: 'reply-1',
	...overrides
});

const mockReply = (authorId = 'user-1') => ({
	id: 'reply-1',
	authorId
});

const expectDeleteRejected = async ({
	reply,
	input,
	error
}: {
	reply: ReturnType<typeof mockReply> | undefined;
	input?: Parameters<typeof deleteReply>[0];
	error: new (...args: never[]) => Error;
}) => {
	selectMock.mockResolvedValueOnce(reply ? [reply] : []);

	await expect(deleteReply(input ?? deleteInput())).rejects.toBeInstanceOf(error);
	expect(updateMock).not.toHaveBeenCalled();
};

describe('deleteReply', () => {
	beforeEach(() => vi.clearAllMocks());

	it.each([
		{
			name: 'missing reply',
			reply: undefined,
			error: ReplyNotFoundError
		},
		{
			name: 'reply owned by another user',
			reply: mockReply('user-2'),
			error: ReplyForbiddenError
		}
	])('rejects a $name', async ({ reply, error }) => {
		await expectDeleteRejected({ reply, error });
	});

	it('soft deletes a reply owned by the authenticated user', async () => {
		selectMock.mockResolvedValueOnce([mockReply()]);
		updateMock.mockResolvedValueOnce(undefined);

		await expect(deleteReply(deleteInput())).resolves.toEqual({
			id: 'reply-1',
			success: true
		});

		expect(updateMock).toHaveBeenCalled();
	});
});
