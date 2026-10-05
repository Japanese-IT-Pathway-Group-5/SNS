import { fail, redirect } from '@sveltejs/kit';
import {
	moderatePost,
	ModerationConflictError,
	ModerationNotFoundError,
	ModerationValidationError
} from './moderation';

export async function handleHidePost({
	request,
	user,
	d1,
	redirectTo
}: {
	request: Request;
	user: { id: string } | null;
	d1: D1Database | undefined;
	redirectTo: string;
}) {
	if (!user) {
		return fail(401, { hideError: 'Unauthorized', postId: '' });
	}

	if (!d1) {
		return fail(503, { hideError: 'Database is not configured', postId: '' });
	}

	const formData = await request.formData();
	const postId = formData.get('postId')?.toString()?.trim() ?? '';
	const reason = formData.get('reason')?.toString() ?? '';

	if (!postId) {
		return fail(400, { hideError: 'Post ID is required', postId });
	}

	try {
		await moderatePost({
			d1,
			moderatorId: user.id,
			postId,
			action: 'hide',
			reason
		});
	} catch (err) {
		if (err instanceof ModerationValidationError) {
			return fail(400, { hideError: err.message, postId });
		}

		if (err instanceof ModerationNotFoundError) {
			return fail(404, { hideError: 'Post not found', postId });
		}

		if (err instanceof ModerationConflictError) {
			return fail(409, { hideError: 'This post is already hidden', postId });
		}

		if (err instanceof Error && err.message === 'Moderator permission required') {
			return fail(403, { hideError: 'Moderator permission required', postId });
		}

		console.error('Failed to hide post:', err);
		return fail(500, { hideError: 'Failed to hide post. Please try again.', postId });
	}

	redirect(303, redirectTo);
}
