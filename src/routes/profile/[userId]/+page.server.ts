import { error } from '@sveltejs/kit';
import { getPublicProfile } from '$lib/server/profile/get';
import { listPosts } from '$lib/server/posts/list';
import { parsePaginationParams, PaginationValidationError } from '$lib/server/http/pagination';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, url, setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	let pagination;
	try {
		pagination = parsePaginationParams(url);
	} catch (err) {
		if (err instanceof PaginationValidationError) error(400, err.message);
		throw err;
	}
	const d1 = platform?.env?.DB;
	if (!d1) error(503, 'Profiles are temporarily unavailable. Please try again.');
	let profile;
	try {
		profile = await getPublicProfile(d1, params.userId);
	} catch {
		error(503, 'This profile could not load. Please try again.');
	}
	if (!profile) error(404, 'Profile not found');
	try {
		const { items, nextCursor } = await listPosts({
			d1,
			options: { authorId: profile.id, cursor: pagination.cursor }
		});
		return { profile, posts: items, nextCursor, loadError: false };
	} catch {
		return { profile, posts: [], nextCursor: null, loadError: true };
	}
};
