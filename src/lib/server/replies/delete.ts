import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { reply } from '$lib/server/db/schema';

export class ReplyNotFoundError extends Error {}

export class ReplyForbiddenError extends Error {}

export async function deleteReply({
	d1,
	userId,
	postId,
	replyId
}: {
	d1: D1Database;
	userId: string;
	postId: string;
	replyId: string;
}) {
	const trimmedReplyId = replyId?.trim();

	if (!trimmedReplyId) {
		throw new ReplyNotFoundError('Reply not found');
	}

	const db = getDb(d1);

	const existing = await db
		.select({
			id: reply.id,
			authorId: reply.authorId
		})
		.from(reply)
		.where(and(eq(reply.id, trimmedReplyId), eq(reply.postId, postId), isNull(reply.hiddenAt)))
		.limit(1);

	const replyRow = existing[0];

	if (!replyRow) {
		throw new ReplyNotFoundError('Reply not found');
	}

	if (replyRow.authorId !== userId) {
		throw new ReplyForbiddenError('You are not authorized to delete this reply');
	}

	await db
		.update(reply)
		.set({ hiddenAt: new Date() })
		.where(and(eq(reply.id, trimmedReplyId), eq(reply.authorId, userId)));

	return {
		id: trimmedReplyId,
		success: true
	};
}
