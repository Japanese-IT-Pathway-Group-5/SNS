import { and, desc, eq, isNull, lt, or } from 'drizzle-orm';
import { requireMembership } from '$lib/server/auth/authorization';
import { getDb } from '$lib/server/db';
import { post, user } from '$lib/server/db/schema';

export const POSTS_PAGE_SIZE = 20;

export interface PostCursor {
	createdAt: number;
	id: string;
}

export interface ListPostsOptions {
	cursor?: PostCursor;
	limit?: number;
}

export async function listPosts({
	d1,
	userId,
	options = {}
}: {
	d1: D1Database;
	userId: string;
	options?: ListPostsOptions;
}) {
	await requireMembership(d1, userId);

	const db = getDb(d1);
	const limit = Math.min(Math.max(options.limit ?? POSTS_PAGE_SIZE, 1), POSTS_PAGE_SIZE);

	const cursorCondition = options.cursor
		? or(
				lt(post.createdAt, new Date(options.cursor.createdAt)),
				and(eq(post.createdAt, new Date(options.cursor.createdAt)), lt(post.id, options.cursor.id))
			)
		: undefined;

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
		.where(and(isNull(post.hiddenAt), cursorCondition))
		.orderBy(desc(post.createdAt), desc(post.id))
		.limit(limit + 1);

	const hasMore = rows.length > limit;
	const items = hasMore ? rows.slice(0, limit) : rows;

	const last = items.at(-1);

	return {
		items,
		nextCursor:
			hasMore && last
				? {
						createdAt: last.createdAt.getTime(),
						id: last.id
					}
				: null
	};
}
