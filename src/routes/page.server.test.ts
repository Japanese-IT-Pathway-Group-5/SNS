import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeCursor } from '$lib/server/http/pagination';

const { listPostsMock, trendingMock } = vi.hoisted(() => ({
	listPostsMock: vi.fn(),
	trendingMock: vi.fn()
}));

vi.mock('$lib/server/posts/list', () => ({
	listPosts: listPostsMock
}));
vi.mock('$lib/server/posts/trending', () => ({ listTrendingJournals: trendingMock }));

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
		trendingMock.mockResolvedValue([]);
	});

	it('loads the first page without a cursor and returns nextCursor', async () => {
		listPostsMock.mockResolvedValueOnce({ items: [{ id: 'post-1' }], nextCursor: 'next-token' });

		const result = await load(createEvent());

		expect(listPostsMock).toHaveBeenCalledWith(
			expect.objectContaining({ options: { cursor: undefined } })
		);
		expect(result).toEqual({
			posts: [{ id: 'post-1' }],
			nextCursor: 'next-token',
			loadError: false,
			search: '',
			trendingJournals: [],
			trendingError: false
		});
	});

	it('reports a feed failure separately from a genuinely empty journal', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		listPostsMock.mockRejectedValueOnce(new Error('Database unavailable'));
		try {
			expect(await load(createEvent())).toEqual({
				posts: [],
				nextCursor: null,
				loadError: true,
				search: '',
				trendingJournals: [],
				trendingError: false
			});
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it('keeps the feed available when the side panel cannot load', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		listPostsMock.mockResolvedValueOnce({ items: [{ id: 'post-1' }], nextCursor: null });
		trendingMock.mockRejectedValueOnce(new Error('Trending unavailable'));
		try {
			expect(await load(createEvent())).toMatchObject({
				posts: [{ id: 'post-1' }],
				loadError: false,
				trendingJournals: [],
				trendingError: true
			});
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it('keeps the search text when loading a later results page', async () => {
		const cursor = { createdAt: 1788400000000, id: 'post-20' };
		listPostsMock.mockResolvedValueOnce({ items: [], nextCursor: 'next-token' });
		const result = await load(createEvent(`?q=%20coffee%20&cursor=${encodeCursor(cursor)}`));
		expect(listPostsMock).toHaveBeenCalledWith(
			expect.objectContaining({ options: { cursor, search: 'coffee' } })
		);
		expect(result).toMatchObject({ search: 'coffee', nextCursor: 'next-token' });
	});

	it('rejects an oversized search before querying the database', async () => {
		await expect(load(createEvent(`?q=${'a'.repeat(121)}`))).rejects.toMatchObject({ status: 400 });
		expect(listPostsMock).not.toHaveBeenCalled();
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
