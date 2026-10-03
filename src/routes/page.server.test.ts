import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeCursor } from '$lib/server/http/pagination';

const { listPostsMock, requireMembershipMock } = vi.hoisted(() => ({
	listPostsMock: vi.fn(),
	requireMembershipMock: vi.fn()
}));

vi.mock('$lib/server/posts/list', () => ({
	listPosts: listPostsMock
}));

vi.mock('$lib/server/auth/authorization', () => ({
	requireMembership: requireMembershipMock
}));

import { load } from './+page.server';

function createEvent(search = '') {
	return {
		url: new URL(`http://localhost/${search}`),
		locals: {
			user: { id: 'user-123', name: 'Test User' },
			session: null
		},
		platform: {
			env: {
				DB: {}
			}
		}
	} as unknown as Parameters<typeof load>[0];
}

describe('home feed load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		requireMembershipMock.mockResolvedValue({ role: 'member' });
	});

	it('loads the first page without a cursor and returns nextCursor', async () => {
		listPostsMock.mockResolvedValueOnce({ items: [{ id: 'post-1' }], nextCursor: 'next-token' });

		const result = await load(createEvent());

		expect(listPostsMock).toHaveBeenCalledWith(
			expect.objectContaining({ userId: 'user-123', options: { cursor: undefined } })
		);
		expect(result).toEqual({
			isMember: true,
			posts: [{ id: 'post-1' }],
			nextCursor: 'next-token'
		});
	});

	it('passes the decoded ?cursor= token to listPosts', async () => {
		const cursor = { createdAt: 1788400000000, id: 'post-20' };
		listPostsMock.mockResolvedValueOnce({ items: [], nextCursor: null });

		const result = await load(createEvent(`?cursor=${encodeCursor(cursor)}`));

		expect(listPostsMock).toHaveBeenCalledWith(expect.objectContaining({ options: { cursor } }));
		expect(result).toMatchObject({ nextCursor: null });
	});

	it('responds 400 for an invalid cursor token', async () => {
		await expect(load(createEvent('?cursor=%%%'))).rejects.toMatchObject({ status: 400 });
		expect(listPostsMock).not.toHaveBeenCalled();
	});
});
