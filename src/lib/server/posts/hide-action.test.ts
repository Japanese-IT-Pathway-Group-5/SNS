import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	moderatePostMock,
	ModerationValidationErrorClass,
	ModerationNotFoundErrorClass,
	ModerationConflictErrorClass
} = vi.hoisted(() => ({
	moderatePostMock: vi.fn(),
	ModerationValidationErrorClass: class ModerationValidationError extends Error {},
	ModerationNotFoundErrorClass: class ModerationNotFoundError extends Error {},
	ModerationConflictErrorClass: class ModerationConflictError extends Error {}
}));

vi.mock('./moderation', () => ({
	moderatePost: moderatePostMock,
	ModerationValidationError: ModerationValidationErrorClass,
	ModerationNotFoundError: ModerationNotFoundErrorClass,
	ModerationConflictError: ModerationConflictErrorClass
}));

import { handleHidePost } from './hide-action';

function makeRequest(fields: Record<string, string>) {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		form.append(key, value);
	}
	return new Request('http://localhost/', { method: 'POST', body: form });
}

const mockD1 = {} as D1Database;
const mockUser = { id: 'mod-1' };

describe('handleHidePost', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 401 when the user is not logged in', async () => {
		const result = await handleHidePost({
			request: makeRequest({ postId: 'post-1', reason: 'Spam' }),
			user: null,
			d1: mockD1,
			redirectTo: '/'
		});

		expect(result).toMatchObject({ status: 401 });
	});

	it('returns 503 when D1 is unavailable', async () => {
		const result = await handleHidePost({
			request: makeRequest({ postId: 'post-1', reason: 'Spam' }),
			user: mockUser,
			d1: undefined,
			redirectTo: '/'
		});

		expect(result).toMatchObject({ status: 503 });
	});

	it('returns 400 when postId is empty', async () => {
		const result = await handleHidePost({
			request: makeRequest({ postId: '', reason: 'Spam' }),
			user: mockUser,
			d1: mockD1,
			redirectTo: '/'
		});

		expect(result).toMatchObject({ status: 400 });
		const data = (result as { data: { hideError: string; postId: string } }).data;
		expect(data.hideError).toBe('Post ID is required');
	});

	it('returns 400 when postId is missing entirely', async () => {
		const result = await handleHidePost({
			request: makeRequest({ reason: 'Spam' }),
			user: mockUser,
			d1: mockD1,
			redirectTo: '/'
		});

		expect(result).toMatchObject({ status: 400 });
	});

	it('returns 400 for validation errors from moderatePost', async () => {
		moderatePostMock.mockRejectedValueOnce(
			new ModerationValidationErrorClass('Moderation reason is required')
		);

		const result = await handleHidePost({
			request: makeRequest({ postId: 'post-1', reason: '' }),
			user: mockUser,
			d1: mockD1,
			redirectTo: '/'
		});

		expect(result).toMatchObject({ status: 400 });
		const data = (result as { data: { hideError: string; postId: string } }).data;
		expect(data.hideError).toBe('Moderation reason is required');
		expect(data.postId).toBe('post-1');
	});

	it('returns 404 when the post does not exist', async () => {
		moderatePostMock.mockRejectedValueOnce(new ModerationNotFoundErrorClass('Post not found'));

		const result = await handleHidePost({
			request: makeRequest({ postId: 'missing', reason: 'Spam' }),
			user: mockUser,
			d1: mockD1,
			redirectTo: '/'
		});

		expect(result).toMatchObject({ status: 404 });
		const data = (result as { data: { hideError: string; postId: string } }).data;
		expect(data.hideError).toBe('Post not found');
		expect(data.postId).toBe('missing');
	});

	it('returns 409 when the post is already hidden', async () => {
		moderatePostMock.mockRejectedValueOnce(
			new ModerationConflictErrorClass('Post is already hidden')
		);

		const result = await handleHidePost({
			request: makeRequest({ postId: 'post-1', reason: 'Spam' }),
			user: mockUser,
			d1: mockD1,
			redirectTo: '/'
		});

		expect(result).toMatchObject({ status: 409 });
		const data = (result as { data: { hideError: string; postId: string } }).data;
		expect(data.hideError).toBe('This post is already hidden');
		expect(data.postId).toBe('post-1');
	});

	it('returns 403 when the user is not a moderator', async () => {
		moderatePostMock.mockRejectedValueOnce(new Error('Moderator permission required'));

		const result = await handleHidePost({
			request: makeRequest({ postId: 'post-1', reason: 'Spam' }),
			user: mockUser,
			d1: mockD1,
			redirectTo: '/'
		});

		expect(result).toMatchObject({ status: 403 });
		const data = (result as { data: { hideError: string; postId: string } }).data;
		expect(data.hideError).toBe('Moderator permission required');
		expect(data.postId).toBe('post-1');
	});

	it('would break if the authorization error message changes', async () => {
		moderatePostMock.mockRejectedValueOnce(new Error('Some other permission error'));

		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const result = await handleHidePost({
				request: makeRequest({ postId: 'post-1', reason: 'Spam' }),
				user: mockUser,
				d1: mockD1,
				redirectTo: '/'
			});

			// Falls through to the 500 catch-all, not the 403 branch.
			expect(result).toMatchObject({ status: 500 });
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it('redirects on success', async () => {
		moderatePostMock.mockResolvedValueOnce({
			postId: 'post-1',
			action: 'hide',
			hiddenAt: new Date()
		});

		await expect(
			handleHidePost({
				request: makeRequest({ postId: 'post-1', reason: 'Spam' }),
				user: mockUser,
				d1: mockD1,
				redirectTo: '/'
			})
		).rejects.toMatchObject({
			status: 303,
			location: '/'
		});
	});

	it('calls moderatePost with the correct arguments', async () => {
		moderatePostMock.mockResolvedValueOnce({
			postId: 'post-1',
			action: 'hide',
			hiddenAt: new Date()
		});

		try {
			await handleHidePost({
				request: makeRequest({ postId: 'post-1', reason: 'Inappropriate content' }),
				user: mockUser,
				d1: mockD1,
				redirectTo: '/feed'
			});
		} catch {
			// redirect throws
		}

		expect(moderatePostMock).toHaveBeenCalledWith({
			d1: mockD1,
			moderatorId: 'mod-1',
			postId: 'post-1',
			action: 'hide',
			reason: 'Inappropriate content'
		});
	});

	it('includes postId in every fail() payload', async () => {
		moderatePostMock.mockRejectedValueOnce(
			new ModerationValidationErrorClass('Moderation reason is required')
		);

		const result = await handleHidePost({
			request: makeRequest({ postId: 'post-42', reason: '' }),
			user: mockUser,
			d1: mockD1,
			redirectTo: '/'
		});

		const data = (result as { data: { postId: string } }).data;
		expect(data.postId).toBe('post-42');
	});

	it('returns 500 for unexpected errors', async () => {
		moderatePostMock.mockRejectedValueOnce(new Error('Database exploded'));

		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const result = await handleHidePost({
				request: makeRequest({ postId: 'post-1', reason: 'Spam' }),
				user: mockUser,
				d1: mockD1,
				redirectTo: '/'
			});

			expect(result).toMatchObject({ status: 500 });
			const data = (result as { data: { hideError: string; postId: string } }).data;
			expect(data.postId).toBe('post-1');
		} finally {
			consoleSpy.mockRestore();
		}
	});
});
