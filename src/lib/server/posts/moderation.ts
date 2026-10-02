import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { moderationEvent, post } from '$lib/server/db/schema';
import { requireModerator } from '$lib/server/auth/authorization';

export type ModerationAction = 'hide' | 'unhide';

const MAX_REASON_LENGTH = 500;

export class ModerationValidationError extends Error {}
export class ModerationNotFoundError extends Error {}

export async function moderatePost({
	d1,
	moderatorId,
	postId,
	action,
	reason
}: {
	d1: D1Database;
	moderatorId: string;
	postId: string;
	action: ModerationAction;
	reason: string;
}) {
	await requireModerator(d1, moderatorId);

	const normalizedReason = reason.trim();

	if (!normalizedReason) {
		throw new ModerationValidationError('Moderation reason is required');
	}

	if (normalizedReason.length > MAX_REASON_LENGTH) {
		throw new ModerationValidationError(
			`Moderation reason must be ${MAX_REASON_LENGTH} characters or fewer`
		);
	}

	if (action !== 'hide' && action !== 'unhide') {
		throw new ModerationValidationError('Invalid moderation action');
	}

	const db = getDb(d1);

	const existing = await db
		.select({
			id: post.id,
			hiddenAt: post.hiddenAt
		})
		.from(post)
		.where(eq(post.id, postId))
		.limit(1);

	if (!existing[0]) {
		throw new ModerationNotFoundError('Post not found');
	}

	const hiddenAt = action === 'hide' ? new Date() : null;

	await db.update(post).set({ hiddenAt }).where(eq(post.id, postId));

	await db.insert(moderationEvent).values({
		action,
		reason: normalizedReason,
		moderatorId,
		postId
	});

	return {
		postId,
		action,
		hiddenAt
	};
}
