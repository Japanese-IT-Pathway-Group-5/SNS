import { json, type RequestHandler } from '@sveltejs/kit';
import { getPost, PostNotFoundError } from '$lib/server/posts/get';
import { updatePost, PostForbiddenError, PostValidationError } from '$lib/server/posts/update';
import { deletePost } from '$lib/server/posts/delete';
import type { R2Storage } from '$lib/server/storage/r2';

function handlePostMutationError(error: unknown, failureMessage: string) {
	if (error instanceof PostValidationError) {
		return json({ error: error.message }, { status: 400 });
	}

	if (error instanceof PostForbiddenError) {
		return json({ error: error.message }, { status: 403 });
	}

	if (error instanceof PostNotFoundError) {
		return json({ error: 'Post not found' }, { status: 404 });
	}

	console.error(failureMessage, error);
	return json({ error: failureMessage }, { status: 500 });
}

function resolvePostContext(
	locals: App.Locals,
	platform: Readonly<App.Platform> | undefined,
	postIdParam: string | undefined
) {
	if (!locals.user) {
		return { error: json({ error: 'Unauthorized' }, { status: 401 }) };
	}

	const env = platform?.env as {
		DB?: D1Database;
		MEDIA_BUCKET?: R2Storage;
	};

	if (!env?.DB) {
		return { error: json({ error: 'Database is not configured' }, { status: 503 }) };
	}

	const postId = postIdParam?.trim();
	if (!postId) {
		return { error: json({ error: 'postId is required' }, { status: 400 }) };
	}

	return { user: locals.user, db: env.DB, mediaBucket: env.MEDIA_BUCKET, postId };
}

export const GET: RequestHandler = async ({ params, platform }) => {
	const env = platform?.env as {
		DB?: D1Database;
	};

	if (!env?.DB) {
		return json({ error: 'Database is not configured' }, { status: 503 });
	}

	const postId = params.postId?.trim();

	if (!postId) {
		return json({ error: 'postId is required' }, { status: 400 });
	}

	try {
		const result = await getPost({
			d1: env.DB,
			postId
		});

		return json(result);
	} catch (error) {
		if (error instanceof PostNotFoundError) {
			return json({ error: 'Post not found' }, { status: 404 });
		}

		console.error('Failed to get post:', error);

		return json({ error: 'Failed to get post' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, params, locals, platform }) => {
	const context = resolvePostContext(locals, platform, params.postId);
	if ('error' in context) return context.error;

	let input: unknown;

	try {
		input = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	try {
		const result = await updatePost({
			d1: context.db,
			userId: context.user.id,
			postId: context.postId,
			input: input as Parameters<typeof updatePost>[0]['input']
		});

		return json(result, { status: 200 });
	} catch (error) {
		return handlePostMutationError(error, 'Failed to update post');
	}
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const context = resolvePostContext(locals, platform, params.postId);
	if ('error' in context) return context.error;

	try {
		const result = await deletePost({
			d1: context.db,
			userId: context.user.id,
			postId: context.postId,
			mediaBucket: context.mediaBucket
		});

		return json(result, { status: 200 });
	} catch (error) {
		return handlePostMutationError(error, 'Failed to delete post');
	}
};
