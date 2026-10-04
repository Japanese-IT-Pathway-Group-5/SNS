import { error, fail, redirect } from '@sveltejs/kit';
import { getPost, PostNotFoundError } from '$lib/server/posts/get';
import { createReply, ReplyNotFoundError, ReplyValidationError } from '$lib/server/replies/create';
import { listReplies } from '$lib/server/replies/list';
import { requireMembership } from '$lib/server/auth/authorization';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const d1 = platform?.env?.DB;
	if (!d1) error(503, 'Database is not configured');

	if (!locals.user) error(401, 'Unauthorized');
	try {
		await requireMembership(d1, locals.user.id);
	} catch {
		error(403, 'Membership required');
	}

	try {
		const [post, replyPage] = await Promise.all([
			getPost({ d1, postId: params.postId }),
			listReplies({ d1, postId: params.postId })
		]);

		return { post, replies: replyPage.items };
	} catch (cause) {
		if (cause instanceof PostNotFoundError) error(404, 'Post not found');
		console.error('Failed to load post detail:', cause);
		error(500, 'Could not load this post');
	}
};

export const actions: Actions = {
	reply: async ({ request, locals, params, platform }) => {
		if (!locals.user) {
			redirect(303, `/login?redirectTo=${encodeURIComponent(`/post/${params.postId}`)}`);
		}

		const d1 = platform?.env?.DB;
		if (!d1) return fail(503, { message: 'Database is not configured', body: '' });

		try {
			await requireMembership(d1, locals.user.id);
		} catch {
			return fail(403, { message: 'Membership required', body: '' });
		}

		const formData = await request.formData();
		const body = formData.get('body')?.toString() ?? '';

		try {
			await createReply({
				d1,
				userId: locals.user.id,
				postId: params.postId,
				input: { body }
			});
		} catch (cause) {
			if (cause instanceof ReplyValidationError) {
				return fail(400, { message: cause.message, body });
			}
			if (cause instanceof ReplyNotFoundError) error(404, 'Post not found');
			console.error('Failed to create reply:', cause);
			return fail(500, { message: 'Could not post your reply. Please try again.', body });
		}

		redirect(303, `/post/${params.postId}`);
	}
};
