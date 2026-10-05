import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { moderationEvent, post } from '$lib/server/db/schema';
import { requireModerator } from '$lib/server/auth/authorization';

export type ModerationAction = 'hide' | 'unhide';

const MAX_REASON_LENGTH = 500;

export class ModerationValidationError extends Error {}
export class ModerationNotFoundError extends Error {}
export class ModerationConflictError extends Error {}

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

	if (action === 'hide') {
		const hiddenAt = new Date();

		// Race-safe: only update if not already hidden.
		const result = await db
			.update(post)
			.set({ hiddenAt })
			.where(and(eq(post.id, postId), isNull(post.hiddenAt)))
			.returning({ id: post.id });

		if (result.length === 0) {
			// Distinguish "post doesn't exist" from "already hidden".
			const existing = await db
				.select({ id: post.id })
				.from(post)
				.where(eq(post.id, postId))
				.limit(1);

			if (!existing[0]) {
				throw new ModerationNotFoundError('Post not found');
			}

			throw new ModerationConflictError('Post is already hidden');
		}

		// Audit event only written when the update changed a row.
		await db.insert(moderationEvent).values({
			action,
			reason: normalizedReason,
			moderatorId,
			postId
		});

		return { postId, action, hiddenAt };
	}

	// Unhide path unchanged: select-then-update.
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

	await db.update(post).set({ hiddenAt: null }).where(eq(post.id, postId));

	await db.insert(moderationEvent).values({
		action,
		reason: normalizedReason,
		moderatorId,
		postId
	});

	return {
		postId,
		action,
		hiddenAt: null
	};
}
