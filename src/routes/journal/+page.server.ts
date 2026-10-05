import { error, redirect } from '@sveltejs/kit';
import { parsePaginationParams, PaginationValidationError } from '$lib/server/http/pagination';
import { listPosts } from '$lib/server/posts/list';
import { getOwnProfile } from '$lib/server/profile/update';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (!locals.user) {
		redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	}

	let pagination;
	try {
		pagination = parsePaginationParams(url);
	} catch (err) {
		if (err instanceof PaginationValidationError) {
			throw error(400, err.message);
		}
		throw err;
	}

	const d1 = platform?.env?.DB;
	if (!d1) {
		return {
			posts: [],
			nextCursor: null,
			loadError: true,
			description: '',
			banner: '',
			profileError: true
		};
	}
	const profile = getOwnProfile(d1, locals.user.id).then(
		({ description, banner }) => ({ description, banner, profileError: false }),
		(err) => {
			console.error('Failed to load journal profile:', err);
			return { description: '', banner: '', profileError: true };
		}
	);

	try {
		// Identity comes from the session only; there is no user id in the URL.
		const { items, nextCursor } = await listPosts({
			d1,
			options: { cursor: pagination.cursor, authorId: locals.user.id }
		});

		return { posts: items, nextCursor, loadError: false, ...(await profile) };
	} catch (err) {
		console.error('Failed to load journal:', err);
		return { posts: [], nextCursor: null, loadError: true, ...(await profile) };
	}
};
