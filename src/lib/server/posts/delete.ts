import { and, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { media, post, reply } from '$lib/server/db/schema';
import { cleanupUploadedPhoto } from '$lib/server/storage/photo-cleanup';
import type { R2Storage } from '$lib/server/storage/r2';
import { PostValidationError } from './create';
import { PostNotFoundError } from './get';
import { PostForbiddenError } from './update';

export { PostValidationError, PostNotFoundError, PostForbiddenError };

export async function deletePost({
	d1,
	userId,
	postId,
	mediaBucket
}: {
	d1: D1Database;
	userId: string;
	postId: string;
	mediaBucket?: R2Storage;
}) {
	const trimmedPostId = postId?.trim();
	if (!trimmedPostId) {
		throw new PostValidationError('postId is required');
	}

	const db = getDb(d1);

	const existing = await db
		.select({
			id: post.id,
			authorId: post.authorId,
			mediaId: post.mediaId
		})
		.from(post)
		.where(eq(post.id, trimmedPostId))
		.limit(1);

	const postRow = existing[0];

	if (!postRow) {
		throw new PostNotFoundError('Post not found');
	}

	if (postRow.authorId !== userId) {
		throw new PostForbiddenError('You are not authorized to delete this post');
	}

	let objectKey: string | undefined;

	if (postRow.mediaId) {
		const mediaRows = await db
			.select({
				id: media.id,
				objectKey: media.objectKey,
				status: media.status
			})
			.from(media)
			.where(eq(media.id, postRow.mediaId))
			.limit(1);

		if (mediaRows[0]) {
			objectKey = mediaRows[0].objectKey;
		}

		await db.update(media).set({ status: 'cleanup' }).where(eq(media.id, postRow.mediaId));
	}

	await db.delete(reply).where(eq(reply.postId, trimmedPostId));

	await db.delete(post).where(and(eq(post.id, trimmedPostId), eq(post.authorId, userId)));

	if (mediaBucket && objectKey) {
		try {
			await cleanupUploadedPhoto(mediaBucket, objectKey);
			await db.delete(media).where(eq(media.id, postRow.mediaId!));
		} catch (error) {
			console.error('Failed to clean up post image from storage:', error);
		}
	}

	return {
		id: trimmedPostId,
		success: true
	};
}
