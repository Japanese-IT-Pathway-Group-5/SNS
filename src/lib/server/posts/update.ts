import { and, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { updatePostInputSchema, type UpdatePostInput } from '$lib/validation/posts';
import { PostValidationError } from './create';
import { PostNotFoundError } from './get';

export class PostForbiddenError extends Error {}
export { PostValidationError, PostNotFoundError };

export async function updatePost({
	d1,
	userId,
	postId,
	input
}: {
	d1: D1Database;
	userId: string;
	postId: string;
	input: UpdatePostInput;
}) {
	const parsed = updatePostInputSchema.safeParse(input);

	if (!parsed.success) {
		throw new PostValidationError(parsed.error.issues[0]?.message ?? 'Invalid post');
	}

	const trimmedPostId = postId?.trim();
	if (!trimmedPostId) {
		throw new PostValidationError('postId is required');
	}

	const { body } = parsed.data;
	const db = getDb(d1);

	const existing = await db
		.select({
			id: post.id,
			authorId: post.authorId,
			submissionId: post.submissionId,
			body: post.body,
			mediaId: post.mediaId,
			hiddenAt: post.hiddenAt,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt
		})
		.from(post)
		.where(eq(post.id, trimmedPostId))
		.limit(1);

	const postRow = existing[0];

	if (!postRow || postRow.hiddenAt !== null) {
		throw new PostNotFoundError('Post not found');
	}

	if (postRow.authorId !== userId) {
		throw new PostForbiddenError('You are not authorized to edit this post');
	}

	if (!body.trim() && !postRow.mediaId) {
		throw new PostValidationError('Post requires text or an image');
	}

	const now = new Date();

	await db
		.update(post)
		.set({
			body,
			updatedAt: now
		})
		.where(and(eq(post.id, trimmedPostId), eq(post.authorId, userId)));

	return {
		id: postRow.id,
		authorId: postRow.authorId,
		submissionId: postRow.submissionId,
		body,
		mediaId: postRow.mediaId,
		createdAt: postRow.createdAt,
		updatedAt: now
	};
}
