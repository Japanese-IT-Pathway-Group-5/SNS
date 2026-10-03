import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { post, user } from '$lib/server/db/schema';

export class PostNotFoundError extends Error {}

export async function getPost({ d1, postId }: { d1: D1Database; postId: string }) {
	const db = getDb(d1);

	const rows = await db
		.select({
			id: post.id,
			authorId: post.authorId,
			authorName: user.name,
			authorImage: user.image,
			submissionId: post.submissionId,
			body: post.body,
			mediaId: post.mediaId,
			createdAt: post.createdAt
		})
		.from(post)
		.innerJoin(user, eq(user.id, post.authorId))
		.where(and(eq(post.id, postId), isNull(post.hiddenAt)))
		.limit(1);

	if (!rows[0]) {
		throw new PostNotFoundError('Post not found');
	}

	return rows[0];
}
