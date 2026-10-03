import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { post, user } from '$lib/server/db/schema';
import { encodeCursor, type PaginationCursor } from '$lib/server/http/pagination';
import { searchQuerySchema } from '$lib/validation/search';

export const POSTS_PAGE_SIZE = 20;

export type PostCursor = PaginationCursor;

export interface ListPostsOptions {
	cursor?: PostCursor;
	limit?: number;
	search?: string;
}

export async function listPosts({
	d1,
	options = {}
}: {
	d1: D1Database;
	options?: ListPostsOptions;
}) {
	const db = getDb(d1);
	const limit = Math.min(Math.max(options.limit ?? POSTS_PAGE_SIZE, 1), POSTS_PAGE_SIZE);
	const search = searchQuerySchema.parse(options.search ?? '');
	// instr treats percent signs, underscores and quotes as literal text, not SQL patterns.
	const searchCondition = search
		? sql`instr(lower(${post.body}), lower(${search})) > 0`
		: undefined;

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
		.where(and(isNull(post.hiddenAt), cursorCondition, searchCondition))
		.orderBy(desc(post.createdAt), desc(post.id))
		.limit(limit + 1);

	const hasMore = rows.length > limit;
	const items = hasMore ? rows.slice(0, limit) : rows;

	const last = items.at(-1);

	return {
		items,
		// Opaque token for `?cursor=`; null on the last page.
		nextCursor:
			hasMore && last ? encodeCursor({ createdAt: last.createdAt.getTime(), id: last.id }) : null
	};
}
