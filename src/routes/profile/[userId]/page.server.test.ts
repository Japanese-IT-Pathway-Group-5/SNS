import { beforeEach, expect, it, vi } from 'vitest';
import { encodeCursor } from '$lib/server/http/pagination';
const { profile, posts } = vi.hoisted(() => ({ profile: vi.fn(), posts: vi.fn() }));
vi.mock('$lib/server/profile/get', () => ({ getPublicProfile: profile }));
vi.mock('$lib/server/posts/list', () => ({ listPosts: posts }));
import { load } from './+page.server';
const event = (search = '') =>
	({
		params: { userId: 'other-user' },
		locals: { user: null },
		platform: { env: { DB: {} } },
		url: new URL('https://example.invalid/profile/other-user' + search),
		setHeaders: vi.fn()
	}) as unknown as Parameters<typeof load>[0];
beforeEach(() => {
	vi.clearAllMocks();
	profile.mockResolvedValue({
		id: 'other-user',
		name: 'Aiko',
		image: null,
		description: '',
		banner: ''
	});
	posts.mockResolvedValue({ items: [], nextCursor: null });
});
it('allows guest reads and scopes every cursor page to the route author', async () => {
	const cursor = { createdAt: 1000, id: 'post-1' };
	const result = await load(event('?authorId=attacker&cursor=' + encodeCursor(cursor)));
	expect(result).toMatchObject({ loadError: false, profile: { id: 'other-user' } });
	expect(posts).toHaveBeenCalledWith({ d1: {}, options: { authorId: 'other-user', cursor } });
});
it('returns 404 for a missing profile without reading posts', async () => {
	profile.mockResolvedValue(null);
	await expect(load(event())).rejects.toMatchObject({ status: 404 });
	expect(posts).not.toHaveBeenCalled();
});
it('rejects malformed cursors before querying', async () => {
	await expect(load(event('?cursor=%%%'))).rejects.toMatchObject({ status: 400 });
	expect(profile).not.toHaveBeenCalled();
});
it('distinguishes failed entries from an empty journal', async () => {
	posts.mockRejectedValue(new Error('Database unavailable'));
	expect(await load(event())).toMatchObject({
		loadError: true,
		profile: { name: 'Aiko' },
		posts: []
	});
});
it('returns a safe service error for failed profile reads', async () => {
	profile.mockRejectedValue(new Error('private database details'));
	await expect(load(event())).rejects.toMatchObject({
		status: 503,
		body: { message: 'This profile could not load. Please try again.' }
	});
});
