import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { post, postLike, user } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export class PostNotFoundError extends Error {}

export async function getPost({
	d1,
	postId,
	userId
}: {
	d1: D1Database;
	postId: string;
	userId?: string;
}) {
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
			createdAt: post.createdAt,
			isLiked: userId
				? sql<boolean>`exists (select 1 from ${postLike} where ${postLike.postId} = ${post.id} and ${postLike.userId} = ${userId})`.mapWith(
						Boolean
					)
				: sql<boolean>`0`.mapWith(Boolean)
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
