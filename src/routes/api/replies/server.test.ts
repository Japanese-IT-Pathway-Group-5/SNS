import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createReplyMock, ReplyNotFoundErrorMock, ReplyValidationErrorMock } = vi.hoisted(() => ({
	createReplyMock: vi.fn(),
	ReplyNotFoundErrorMock: class ReplyNotFoundError extends Error {},
	ReplyValidationErrorMock: class ReplyValidationError extends Error {}
}));

vi.mock('$lib/server/replies/create', () => ({
	createReply: createReplyMock,
	ReplyNotFoundError: ReplyNotFoundErrorMock,
	ReplyValidationError: ReplyValidationErrorMock
}));

import { POST } from './+server';

const makeEvent = (overrides: Record<string, unknown> = {}) =>
	({
		request: new Request('http://localhost/api/replies?postId=post-1', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({ body: 'Hello' })
		}),
		locals: {
			user: {
				id: 'user-1'
			}
		},
		platform: {
			env: {
				DB: {}
			}
		},
		url: new URL('http://localhost/api/replies?postId=post-1'),
		...overrides
	}) as Parameters<typeof POST>[0];

describe('POST /api/replies', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects unauthenticated requests', async () => {
		const response = await POST(
			makeEvent({
				locals: {
					user: null
				}
			})
		);

		expect(response.status).toBe(401);
	});

	it('requires postId', async () => {
		const response = await POST(
			makeEvent({
				url: new URL('http://localhost/api/replies')
			})
		);

		expect(response.status).toBe(400);
	});

	it('rejects invalid JSON', async () => {
		const response = await POST(
			makeEvent({
				request: new Request('http://localhost/api/replies?postId=post-1', {
					method: 'POST',
					headers: {
						'content-type': 'application/json'
					},
					body: '{'
				})
			})
		);

		expect(response.status).toBe(400);
	});

	it('returns 403 when membership is required', async () => {
		createReplyMock.mockRejectedValueOnce(new Error('Membership required'));

		const response = await POST(makeEvent());

		expect(response.status).toBe(403);
	});

	it('returns 404 when the parent post is hidden or missing', async () => {
		createReplyMock.mockRejectedValueOnce(new ReplyNotFoundErrorMock('Post not found'));

		const response = await POST(makeEvent());

		expect(response.status).toBe(404);
	});

	it('returns 400 for validation errors', async () => {
		createReplyMock.mockRejectedValueOnce(new ReplyValidationErrorMock('Reply is required'));

		const response = await POST(makeEvent());

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'Reply is required'
		});
	});

	it('returns 503 when the database is unavailable', async () => {
		const response = await POST(
			makeEvent({
				platform: {
					env: {}
				}
			})
		);

		expect(response.status).toBe(503);
	});

	it('creates a reply using the authenticated user and post ID', async () => {
		createReplyMock.mockResolvedValueOnce({
			id: 'reply-1',
			postId: 'post-1',
			authorId: 'user-1',
			body: 'Hello'
		});

		const response = await POST(makeEvent());

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({
			id: 'reply-1',
			postId: 'post-1',
			authorId: 'user-1',
			body: 'Hello'
		});

		expect(createReplyMock).toHaveBeenCalledWith({
			d1: {},
			userId: 'user-1',
			postId: 'post-1',
			input: {
				body: 'Hello'
			}
		});
	});
});
