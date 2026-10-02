import { json, type RequestHandler } from '@sveltejs/kit';
import { parsePaginationParams, PaginationValidationError } from '$lib/server/http/pagination';
import { createPost, PostValidationError } from '$lib/server/posts/create';
import { listPosts } from '$lib/server/posts/list';
import { rateLimitPost } from '$lib/server/security/rate-limit';
import type { R2Storage } from '$lib/server/storage/r2';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const env = platform?.env as {
		DB?: D1Database;
	};

	if (!env.DB) {
		return json({ error: 'Database is not configured' }, { status: 503 });
	}

	let pagination;

	try {
		pagination = parsePaginationParams(url);
	} catch (error) {
		if (error instanceof PaginationValidationError) {
			return json({ error: error.message }, { status: 400 });
		}

		throw error;
	}

	try {
		const result = await listPosts({
			d1: env.DB,
			userId: locals.user.id,
			options: pagination
		});

		return json(result);
	} catch (error) {
		if (error instanceof Error && error.message === 'Membership required') {
			return json({ error: 'Membership required' }, { status: 403 });
		}

		console.error('Failed to list posts:', error);

		return json({ error: 'Failed to list posts' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const rateLimitResult = await rateLimitPost(platform?.env?.POST_RATE_LIMITER, locals.user.id);

	if (!rateLimitResult.allowed) {
		return json({ error: 'Too many post requests' }, { status: rateLimitResult.status });
	}

	const env = platform?.env as {
		DB?: D1Database;
		MEDIA_BUCKET?: R2Storage;
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

	try {
		const result = await createPost({
			d1: env.DB,
			userId: locals.user.id,
			input: input as Parameters<typeof createPost>[0]['input'],
			mediaBucket: env.MEDIA_BUCKET
		});

		return json(result, { status: 201 });
	} catch (error) {
		if (error instanceof PostValidationError) {
			return json({ error: error.message }, { status: 400 });
		}

		if (error instanceof Error && error.message === 'Membership required') {
			return json({ error: 'Membership required' }, { status: 403 });
		}

		console.error('Failed to create post:', error);

		return json({ error: 'Failed to create post' }, { status: 500 });
	}
};
