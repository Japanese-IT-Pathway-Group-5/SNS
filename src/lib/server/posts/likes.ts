import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { post, postLike } from '$lib/server/db/schema';

export class LikePostNotFoundError extends Error {}

export async function setPostLike({
	d1,
	postId,
	userId,
	liked
}: {
	d1: D1Database;
	postId: string;
	userId: string;
	liked: boolean;
}) {
	const db = getDb(d1);
	const visiblePost = await db
		.select({ id: post.id })
		.from(post)
		.where(and(eq(post.id, postId), isNull(post.hiddenAt)))
		.limit(1);

	if (!visiblePost[0]) {
		throw new LikePostNotFoundError('Post not found');
	}

	if (liked) {
		await db.insert(postLike).values({ postId, userId }).onConflictDoNothing();
	} else {
		await db.delete(postLike).where(and(eq(postLike.postId, postId), eq(postLike.userId, userId)));
	}

	return { postId, liked };
}
