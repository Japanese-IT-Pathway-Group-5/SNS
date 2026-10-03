import { json, type RequestHandler } from '@sveltejs/kit';
import { getPost, PostNotFoundError } from '$lib/server/posts/get';

export const GET: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const env = platform?.env as {
		DB?: D1Database;
	};

	if (!env.DB) {
		return json({ error: 'Database is not configured' }, { status: 503 });
	}

	const postId = params.postId?.trim();

	if (!postId) {
		return json({ error: 'postId is required' }, { status: 400 });
	}

	try {
		const result = await getPost({
			d1: env.DB,
			userId: locals.user.id,
			postId
		});

		return json(result);
	} catch (error) {
		if (error instanceof PostNotFoundError) {
			return json({ error: 'Post not found' }, { status: 404 });
		}

		if (error instanceof Error && error.message === 'Membership required') {
			return json({ error: 'Membership required' }, { status: 403 });
		}

		console.error('Failed to get post:', error);

		return json({ error: 'Failed to get post' }, { status: 500 });
	}
};
