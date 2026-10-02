import { error, fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { post, user } from '$lib/server/db/schema';
import { desc, eq, isNull } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		return { posts: [] };
	}

	const db = getDb(platform?.env?.DB as D1Database);

	const posts = await db
		.select({
			id: post.id,
			body: post.body,
			imageKey: post.imageKey,
			createdAt: post.createdAt,
			author: {
				name: user.name,
				image: user.image
			}
		})
		.from(post)
		.innerJoin(user, eq(post.authorId, user.id))
		.where(isNull(post.hiddenAt))
		.orderBy(desc(post.createdAt))
		.limit(20);

	return {
		posts
	};
};

export const actions: Actions = {
	createPost: async ({ request, locals, platform }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}

		const db = getDb(platform?.env?.DB as D1Database);

		const formData = await request.formData();
		const body = formData.get('body')?.toString() || '';
		const imageKey = formData.get('imageKey')?.toString() || null;

		if (!body.trim() && !imageKey) {
			return fail(400, { message: 'Post cannot be completely empty' });
		}

		if (body.length > 2000) {
			return fail(400, { message: 'Post body must be 2000 characters or less' });
		}

		// Basic submission ID to prevent duplicates on double-click
		const submissionId = crypto.randomUUID();

		try {
			await db.insert(post).values({
				authorId: locals.user.id,
				submissionId,
				body: body.trim(),
				imageKey
			});
			return { success: true };
		} catch (e) {
			console.error('Failed to create post:', e);
			return fail(500, { message: 'Failed to create post' });
		}
	}
};
