import { beforeEach, describe, expect, it, vi } from 'vitest';

const { moderatePostMock, ModerationNotFoundErrorMock, ModerationValidationErrorMock } = vi.hoisted(
	() => ({
		moderatePostMock: vi.fn(),
		ModerationNotFoundErrorMock: class ModerationNotFoundError extends Error {},
		ModerationValidationErrorMock: class ModerationValidationError extends Error {}
	})
);

vi.mock('$lib/server/posts/moderation', () => ({
	moderatePost: moderatePostMock,
	ModerationNotFoundError: ModerationNotFoundErrorMock,
	ModerationValidationError: ModerationValidationErrorMock
}));

import { POST } from './moderation';

const makeEvent = (body: unknown, user: { id: string } | null = { id: 'mod-1' }) =>
	({
		request: new Request('http://localhost/api/posts/moderation', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(body)
		}),
		locals: {
			user
		},
		platform: {
			env: {
				DB: {}
			}
		}
	}) as Parameters<typeof POST>[0];

describe('POST /api/posts/moderation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects unauthenticated requests', async () => {
		const response = await POST(
			makeEvent(
				{
					postId: 'post-1',
					action: 'hide',
					reason: 'Spam'
				},
				null
			)
		);

		expect(response.status).toBe(401);
	});

	it('rejects invalid JSON', async () => {
		const event = makeEvent({});
		event.request = new Request('http://localhost/api/posts/moderation', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: '{'
		});

		const response = await POST(event);

		expect(response.status).toBe(400);
	});

	it('requires postId', async () => {
		const response = await POST(
			makeEvent({
				action: 'hide',
				reason: 'Spam'
			})
		);

		expect(response.status).toBe(400);
	});

	it('returns 403 for non-moderators', async () => {
		moderatePostMock.mockRejectedValueOnce(new Error('Moderator permission required'));

		const response = await POST(
			makeEvent({
				postId: 'post-1',
				action: 'hide',
				reason: 'Spam'
			})
		);

		expect(response.status).toBe(403);
	});

	it('returns 400 for moderation validation errors', async () => {
		moderatePostMock.mockRejectedValueOnce(
			new ModerationValidationErrorMock('Moderation reason is required')
		);

		const response = await POST(
			makeEvent({
				postId: 'post-1',
				action: 'hide',
				reason: ''
			})
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'Moderation reason is required'
		});
	});

	it('returns 404 when the post does not exist', async () => {
		moderatePostMock.mockRejectedValueOnce(new ModerationNotFoundErrorMock('Post not found'));

		const response = await POST(
			makeEvent({
				postId: 'missing',
				action: 'hide',
				reason: 'Spam'
			})
		);

		expect(response.status).toBe(404);
	});

	it('hides a post with the authenticated moderator', async () => {
		moderatePostMock.mockResolvedValueOnce({
			postId: 'post-1',
			action: 'hide',
			hiddenAt: new Date()
		});

		const response = await POST(
			makeEvent({
				postId: 'post-1',
				action: 'hide',
				reason: 'Spam'
			})
		);

		expect(response.status).toBe(200);

		expect(moderatePostMock).toHaveBeenCalledWith({
			d1: {},
			moderatorId: 'mod-1',
			postId: 'post-1',
			action: 'hide',
			reason: 'Spam'
		});
	});

	it('unhides a post with the authenticated moderator', async () => {
		moderatePostMock.mockResolvedValueOnce({
			postId: 'post-1',
			action: 'unhide',
			hiddenAt: null
		});

		const response = await POST(
			makeEvent({
				postId: 'post-1',
				action: 'unhide',
				reason: 'Review completed'
			})
		);

		expect(response.status).toBe(200);

		expect(moderatePostMock).toHaveBeenCalledWith({
			d1: {},
			moderatorId: 'mod-1',
			postId: 'post-1',
			action: 'unhide',
			reason: 'Review completed'
		});
	});

	it('returns 503 when the database is unavailable', async () => {
		const event = makeEvent({
			postId: 'post-1',
			action: 'hide',
			reason: 'Spam'
		});

		event.platform = {
			env: {}
		} as App.Platform;

		const response = await POST(event);

		expect(response.status).toBe(503);
	});
});
