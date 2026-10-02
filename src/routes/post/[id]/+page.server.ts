import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getDb } from '$lib/server/db';
import { post, reply } from '$lib/server/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	if (!platform?.env?.DB) {
		throw error(500, 'Database is not available');
	}
	const db = getDb(platform.env.DB);
	const postId = params.id;

	const postData = await db.query.post.findFirst({
		where: and(eq(post.id, postId), isNull(post.hiddenAt)),
		with: {
			author: {
				columns: {
					name: true,
					image: true
				}
			}
		}
	});

	if (!postData) {
		throw error(404, 'Post not found');
	}

	const repliesData = await db.query.reply.findMany({
		where: and(eq(reply.postId, postId), isNull(reply.hiddenAt)),
		orderBy: [asc(reply.createdAt)],
		with: {
			author: {
				columns: {
					name: true,
					image: true
				}
			}
		}
	});

	return {
		post: postData,
		replies: repliesData,
		user: locals.user
	};
};

export const actions: Actions = {
	createReply: async ({ request, params, platform, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in to reply' });
		}
		if (!platform?.env?.DB) {
			return fail(500, { error: 'Database is not available' });
		}
		const db = getDb(platform.env.DB);
		const data = await request.formData();
		const body = data.get('body');

		if (!body || typeof body !== 'string' || body.trim() === '') {
			return fail(400, { error: 'Reply cannot be empty' });
		}
		if (body.length > 500) {
			return fail(400, { error: 'Reply cannot exceed 500 characters', body });
		}

		const postId = params.id;

		await db.insert(reply).values({
			postId: postId,
			authorId: locals.user.id,
			body: body.trim()
		});

		return { success: true };
	},
	deleteReply: async ({ request, platform, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in' });
		}
		if (!platform?.env?.DB) {
			return fail(500, { error: 'Database is not available' });
		}
		const db = getDb(platform.env.DB);
		const data = await request.formData();
		const replyId = data.get('replyId');

		if (!replyId || typeof replyId !== 'string') {
			return fail(400, { error: 'Invalid reply ID' });
		}

		// Verify ownership before deleting
		const existingReply = await db.query.reply.findFirst({
			where: eq(reply.id, replyId)
		});

		if (!existingReply) {
			return fail(404, { error: 'Reply not found' });
		}

		if (existingReply.authorId !== locals.user.id) {
			return fail(403, { error: 'You do not have permission to delete this reply' });
		}

		await db.delete(reply).where(eq(reply.id, replyId));

		return { success: true };
	}
};
