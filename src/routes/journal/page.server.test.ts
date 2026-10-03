import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeCursor } from '$lib/server/http/pagination';

const { listPostsMock } = vi.hoisted(() => ({
	listPostsMock: vi.fn()
}));

vi.mock('$lib/server/posts/list', () => ({
	listPosts: listPostsMock
}));

import { load } from './+page.server';

function createEvent(search = '', user: object | null = { id: 'user-123', name: 'Test User' }) {
	return {
		url: new URL(`http://localhost/journal${search}`),
		locals: { user, session: null },
		platform: { env: { DB: {} } }
	} as unknown as Parameters<typeof load>[0];
}

describe('journal load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('redirects signed-out visitors to login and back to the journal', async () => {
		await expect(load(createEvent('', null))).rejects.toMatchObject({
			status: 302,
			location: '/login?redirectTo=%2Fjournal'
		});
		expect(listPostsMock).not.toHaveBeenCalled();
	});

	it("loads only the signed-in user's own posts", async () => {
		listPostsMock.mockResolvedValueOnce({ items: [{ id: 'post-1' }], nextCursor: 'next-token' });

		const result = await load(createEvent());

		expect(listPostsMock).toHaveBeenCalledWith(
			expect.objectContaining({ options: { cursor: undefined, authorId: 'user-123' } })
		);
		expect(result).toEqual({
			posts: [{ id: 'post-1' }],
			nextCursor: 'next-token',
			loadError: false
		});
	});

	it('ignores any author in the URL and passes the cursor through', async () => {
		const cursor = { createdAt: 1788400000000, id: 'post-20' };
		listPostsMock.mockResolvedValueOnce({ items: [], nextCursor: null });

		await load(createEvent(`?cursor=${encodeCursor(cursor)}&authorId=someone-else`));

		expect(listPostsMock).toHaveBeenCalledWith(
			expect.objectContaining({ options: { cursor, authorId: 'user-123' } })
		);
	});

	it('responds 400 for an invalid cursor', async () => {
		await expect(load(createEvent('?cursor=%%%'))).rejects.toMatchObject({ status: 400 });
		expect(listPostsMock).not.toHaveBeenCalled();
	});

	it('reports a load failure instead of showing an empty journal', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		listPostsMock.mockRejectedValueOnce(new Error('Database unavailable'));
		try {
			expect(await load(createEvent())).toEqual({ posts: [], nextCursor: null, loadError: true });
		} finally {
			consoleSpy.mockRestore();
		}
	});
});
