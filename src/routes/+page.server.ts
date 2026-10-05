import { error, fail } from '@sveltejs/kit';
import { parsePaginationParams, PaginationValidationError } from '$lib/server/http/pagination';
import { createPost, PostValidationError } from '$lib/server/posts/create';
import { listPosts } from '$lib/server/posts/list';
import { handleHidePost } from '$lib/server/posts/hide-action';
import { requireMembership } from '$lib/server/auth/authorization';
import type { PageServerLoad, Actions } from './$types';
import type { R2Storage } from '$lib/server/storage/r2';
import { searchQuerySchema } from '$lib/validation/search';
import { listTrendingJournals } from '$lib/server/posts/trending';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const searchResult = searchQuerySchema.safeParse(url.searchParams.get('q') ?? '');
	if (!searchResult.success) {
		throw error(400, searchResult.error.issues[0].message);
	}
	const search = searchResult.data;
	const d1 = platform?.env?.DB;

	let hasMembership = false;
	if (d1 && locals.user) {
		try {
			await requireMembership(d1, locals.user.id);
			hasMembership = true;
		} catch {
			hasMembership = false;
		}
	}

	if (!d1 || !hasMembership) {
		return {
			posts: [],
			nextCursor: null,
			loadError: true,
			search,
			trendingJournals: [],
			trendingError: true
		};
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

	const trendingResult = listTrendingJournals({ d1 }).then(
		(items) => ({ items, error: false }),
		(err) => {
			console.error('Failed to load trending journals:', err);
			return { items: [], error: true };
		}
	);
	try {
		const [{ items, nextCursor }, trending] = await Promise.all([
			listPosts({
				d1,
				options: { cursor: pagination.cursor, ...(search ? { search } : {}) }
			}),
			trendingResult
		]);

		return {
			posts: items,
			nextCursor,
			loadError: false,
			search,
			trendingJournals: trending.items,
			trendingError: trending.error
		};
	} catch (err) {
		console.error('Failed to load home feed:', err);
		const trending = await trendingResult;
		return {
			posts: [],
			nextCursor: null,
			loadError: true,
			search,
			trendingJournals: trending.items,
			trendingError: trending.error
		};
	}
};

export const actions: Actions = {
	createPost: async ({ request, locals, platform }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}

		const d1 = platform?.env?.DB;
		if (!d1) {
			return fail(503, { message: 'Database is not configured' });
		}

		try {
			await requireMembership(d1, locals.user.id);
		} catch {
			throw error(403, 'Membership required');
		}

		const formData = await request.formData();
		const body = formData.get('body')?.toString() || '';
		const mediaId = formData.get('mediaId')?.toString() || null;
		const submissionId = formData.get('submissionId')?.toString() || crypto.randomUUID();

		try {
			await createPost({
				d1,
				userId: locals.user.id,
				input: {
					submissionId,
					body,
					mediaId
				},
				mediaBucket: platform?.env?.MEDIA_BUCKET as R2Storage | undefined
			});

			return { success: true };
		} catch (err) {
			if (err instanceof PostValidationError) {
				return fail(400, { message: err.message });
			}

			console.error('Failed to create post:', err);
			return fail(500, { message: 'Failed to create post' });
		}
	},

	hidePost: async ({ request, locals, platform }) => {
		return handleHidePost({
			request,
			user: locals.user,
			d1: platform?.env?.DB,
			redirectTo: '/'
		});
	}
};
