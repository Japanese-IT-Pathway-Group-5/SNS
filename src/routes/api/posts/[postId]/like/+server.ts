import { json, type RequestHandler } from '@sveltejs/kit';
import { LikePostNotFoundError, setPostLike } from '$lib/server/posts/likes';

async function updateLike(event: Parameters<RequestHandler>[0], liked: boolean): Promise<Response> {
	const { locals, params, platform } = event;
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database is not configured' }, { status: 503 });
	}
	if (!params.postId) {
		return json({ error: 'Post not found' }, { status: 404 });
	}

	try {
		return json(
			await setPostLike({ d1: db, userId: locals.user.id, postId: params.postId, liked })
		);
	} catch (error) {
		if (error instanceof LikePostNotFoundError) {
			return json({ error: 'Post not found' }, { status: 404 });
		}
		console.error('Failed to update private post like:', error);
		return json({ error: 'Could not update your private likes' }, { status: 500 });
	}
}

export const PUT: RequestHandler = (event) => updateLike(event, true);
export const DELETE: RequestHandler = (event) => updateLike(event, false);
