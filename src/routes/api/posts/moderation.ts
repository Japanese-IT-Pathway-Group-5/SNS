import { json, type RequestHandler } from '@sveltejs/kit';
import {
	moderatePost,
	ModerationNotFoundError,
	ModerationValidationError,
	type ModerationAction
} from '$lib/server/posts/moderation';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const env = platform?.env as {
		DB?: D1Database;
	};

	if (!env.DB) {
		return json({ error: 'Database is not configured' }, { status: 503 });
	}

	let input: unknown;

	try {
		input = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!input || typeof input !== 'object') {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const body = input as Record<string, unknown>;
	const postId = typeof body.postId === 'string' ? body.postId.trim() : '';
	const action = body.action;
	const reason = typeof body.reason === 'string' ? body.reason : '';

	if (!postId) {
		return json({ error: 'postId is required' }, { status: 400 });
	}

	try {
		const result = await moderatePost({
			d1: env.DB,
			moderatorId: locals.user.id,
			postId,
			action: action as ModerationAction,
			reason
		});

		return json(result, { status: 200 });
	} catch (error) {
		if (error instanceof ModerationValidationError) {
			return json({ error: error.message }, { status: 400 });
		}

		if (error instanceof ModerationNotFoundError) {
			return json({ error: 'Post not found' }, { status: 404 });
		}

		if (error instanceof Error && error.message === 'Moderator permission required') {
			return json({ error: 'Moderator permission required' }, { status: 403 });
		}

		console.error('Failed to moderate post:', error);

		return json({ error: 'Failed to moderate post' }, { status: 500 });
	}
};
