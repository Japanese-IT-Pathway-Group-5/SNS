import { json, type RequestHandler } from '@sveltejs/kit';
import { createReply, ReplyNotFoundError, ReplyValidationError } from '$lib/server/replies/create';
import { listReplies } from '$lib/server/replies/list';

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

	const postId = url.searchParams.get('postId')?.trim();

	if (!postId) {
		return json({ error: 'postId is required' }, { status: 400 });
	}

	const cursorCreatedAt = url.searchParams.get('cursorCreatedAt');
	const cursorId = url.searchParams.get('cursorId');

	let cursor:
		| {
				createdAt: number;
				id: string;
		  }
		| undefined;

	if (cursorCreatedAt !== null || cursorId !== null) {
		const createdAt = Number(cursorCreatedAt);

		if (!Number.isFinite(createdAt) || !cursorId?.trim()) {
			return json({ error: 'Invalid cursor' }, { status: 400 });
		}

		cursor = {
			createdAt,
			id: cursorId.trim()
		};
	}

	const limitParam = url.searchParams.get('limit');
	const limit = limitParam === null ? undefined : Number(limitParam);

	if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
		return json({ error: 'Invalid limit' }, { status: 400 });
	}

	try {
		const result = await listReplies({
			d1: env.DB,
			userId: locals.user.id,
			postId,
			cursor,
			limit
		});

		return json(result);
	} catch (error) {
		if (error instanceof Error && error.message === 'Membership required') {
			return json({ error: 'Membership required' }, { status: 403 });
		}

		console.error('Failed to list replies:', error);

		return json({ error: 'Failed to list replies' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals, platform, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const postId = url.searchParams.get('postId')?.trim();

	if (!postId) {
		return json({ error: 'postId is required' }, { status: 400 });
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

	try {
		const result = await createReply({
			d1: env.DB,
			userId: locals.user.id,
			postId,
			input: input as Parameters<typeof createReply>[0]['input']
		});

		return json(result, { status: 201 });
	} catch (error) {
		if (error instanceof ReplyValidationError) {
			return json({ error: error.message }, { status: 400 });
		}

		if (error instanceof ReplyNotFoundError) {
			return json({ error: 'Post not found' }, { status: 404 });
		}

		if (error instanceof Error && error.message === 'Membership required') {
			return json({ error: 'Membership required' }, { status: 403 });
		}

		console.error('Failed to create reply:', error);

		return json({ error: 'Failed to create reply' }, { status: 500 });
	}
};
