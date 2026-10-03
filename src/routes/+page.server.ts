import { error, fail } from '@sveltejs/kit';
import { parsePaginationParams, PaginationValidationError } from '$lib/server/http/pagination';
import { createPost, PostValidationError } from '$lib/server/posts/create';
import { listPosts } from '$lib/server/posts/list';
import type { PageServerLoad, Actions } from './$types';
import type { R2Storage } from '$lib/server/storage/r2';

export const load: PageServerLoad = async ({ platform, url }) => {
	const d1 = platform?.env?.DB;
	if (!d1) {
		return { posts: [], nextCursor: null };
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

	try {
		const { items, nextCursor } = await listPosts({
			d1,
			options: { cursor: pagination.cursor }
		});

		return {
			posts: items,
			nextCursor
		};
	} catch (err) {
		console.error('Failed to load home feed:', err);
		return {
			posts: [],
			nextCursor: null
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
	}
};
