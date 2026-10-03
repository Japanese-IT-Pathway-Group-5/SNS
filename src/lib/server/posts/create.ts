import { and, eq } from 'drizzle-orm';
import { requireMembership } from '$lib/server/auth/authorization';
import { getDb } from '$lib/server/db';
import { media, post } from '$lib/server/db/schema';
import { postInputSchema, type PostInput } from '$lib/validation/posts';
import { withPhotoCleanup } from '$lib/server/storage/with-photo-cleanup';
import type { R2Storage } from '$lib/server/storage/r2';

export class PostValidationError extends Error {}

export async function createPost({
	d1,
	userId,
	input,
	mediaBucket
}: {
	d1: D1Database;
	userId: string;
	input: PostInput;
	mediaBucket?: R2Storage;
}) {
	await requireMembership(d1, userId);

	const parsed = postInputSchema.safeParse(input);

	if (!parsed.success) {
		throw new PostValidationError(parsed.error.issues[0]?.message ?? 'Invalid post');
	}

	const { submissionId, body, mediaId } = parsed.data;

	if (!body.trim() && !mediaId) {
		throw new PostValidationError('Post requires text or an image');
	}

	const db = getDb(d1);

	const existing = await db
		.select({
			id: post.id,
			authorId: post.authorId,
			submissionId: post.submissionId,
			body: post.body,
			mediaId: post.mediaId
		})
		.from(post)
		.where(and(eq(post.authorId, userId), eq(post.submissionId, submissionId)))
		.limit(1);

	if (existing[0]) {
		return existing[0];
	}

	let objectKey: string | undefined;

	if (mediaId) {
		const mediaRow = await db
			.select({
				id: media.id,
				ownerId: media.ownerId,
				objectKey: media.objectKey,
				status: media.status
			})
			.from(media)
			.where(and(eq(media.id, mediaId), eq(media.ownerId, userId), eq(media.status, 'pending')))
			.limit(1);

		if (!mediaRow[0]) {
			throw new PostValidationError('Invalid or unavailable media');
		}

		objectKey = mediaRow[0].objectKey;

		if (!mediaBucket) {
			throw new PostValidationError('Image storage is not configured');
		}
	}

	const create = async () => {
		const id = crypto.randomUUID();

		await db.insert(post).values({
			id,
			authorId: userId,
			submissionId,
			body,
			mediaId: mediaId ?? null
		});

		if (mediaId) {
			await db
				.update(media)
				.set({ status: 'ready' })
				.where(and(eq(media.id, mediaId), eq(media.ownerId, userId), eq(media.status, 'pending')));
		}

		return {
			id,
			authorId: userId,
			submissionId,
			body,
			mediaId: mediaId ?? null
		};
	};

	if (!mediaId || !mediaBucket || !objectKey) {
		return create();
	}

	return withPhotoCleanup({ bucket: mediaBucket, objectKey }, create);
}
