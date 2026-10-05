import { and, desc, eq, isNull, lt, or } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { post, reply, user } from '$lib/server/db/schema';

export const REPLIES_PAGE_SIZE = 20;

export interface ReplyCursor {
	createdAt: number;
	id: string;
}

export async function listReplies({
	d1,
	postId,
	cursor,
	limit = REPLIES_PAGE_SIZE
}: {
	d1: D1Database;
	postId: string;
	cursor?: ReplyCursor;
	limit?: number;
}) {
	const db = getDb(d1);
	const pageSize = Math.min(Math.max(limit, 1), REPLIES_PAGE_SIZE);

	const parent = await db
		.select({
			id: post.id
		})
		.from(post)
		.where(and(eq(post.id, postId), isNull(post.hiddenAt)))
		.limit(1);

	if (!parent[0]) {
		return {
			items: [],
			nextCursor: null
		};
	}

	const cursorCondition = cursor
		? or(
				lt(reply.createdAt, new Date(cursor.createdAt)),
				and(eq(reply.createdAt, new Date(cursor.createdAt)), lt(reply.id, cursor.id))
			)
		: undefined;

	const rows = await db
		.select({
			id: reply.id,
			postId: reply.postId,
			authorId: reply.authorId,
			authorName: user.name,
			authorImage: user.image,
			body: reply.body,
			createdAt: reply.createdAt
		})
		.from(reply)
		.innerJoin(user, eq(user.id, reply.authorId))
		.where(and(eq(reply.postId, postId), isNull(reply.hiddenAt), cursorCondition))
		.orderBy(desc(reply.createdAt), desc(reply.id))
		.limit(pageSize + 1);

	const hasMore = rows.length > pageSize;
	const items = hasMore ? rows.slice(0, pageSize) : rows;
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
