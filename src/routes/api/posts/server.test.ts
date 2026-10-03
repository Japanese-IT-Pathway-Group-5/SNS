import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPostMock, rateLimitPostMock, PostValidationErrorMock } = vi.hoisted(() => ({
	createPostMock: vi.fn(),
	rateLimitPostMock: vi.fn(),
	PostValidationErrorMock: class PostValidationError extends Error {}
}));

vi.mock('$lib/server/posts/create', () => ({
	createPost: createPostMock,
	PostValidationError: PostValidationErrorMock
}));

vi.mock('$lib/server/security/rate-limit', () => ({
	rateLimitPost: rateLimitPostMock
}));

import { POST } from './+server';

function createEvent(
	body: unknown,
	options: {
		user?: object | null;
		db?: object | null;
	} = {}
) {
	return {
		request: new Request('http://localhost/api/posts', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(body)
		}),
		locals: {
			user:
				options.user === undefined
					? {
							id: 'user-123',
							name: 'Test User',
							email: 'test@example.com',
							emailVerified: true,
							image: null,
							createdAt: new Date(),
							updatedAt: new Date()
						}
					: options.user,
			session: null
		},
		platform: {
			env: {
				DB: options.db === undefined ? {} : options.db,
				POST_RATE_LIMITER: {}
			}
		}
	} as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/posts', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		rateLimitPostMock.mockResolvedValue({
			allowed: true
		});

		createPostMock.mockResolvedValue({
			id: 'post-1',
			authorId: 'user-123',
			submissionId: 'sub-1',
			body: 'Hello',
			mediaId: null
		});
	});

	it('returns 401 when unauthenticated', async () => {
		const response = await POST(
			createEvent(
				{
					submissionId: 'sub-1',
					body: 'Hello'
				},
				{ user: null }
			)
		);

		expect(response.status).toBe(401);
		expect(rateLimitPostMock).not.toHaveBeenCalled();
		expect(createPostMock).not.toHaveBeenCalled();
	});

	it('returns 429 when rate limited', async () => {
		rateLimitPostMock.mockResolvedValue({
			allowed: false,
			status: 429
		});

		const response = await POST(
			createEvent({
				submissionId: 'sub-1',
				body: 'Hello'
			})
		);

		expect(response.status).toBe(429);
		expect(createPostMock).not.toHaveBeenCalled();
	});

	it('returns 503 when database is unavailable', async () => {
		const response = await POST(
			createEvent(
				{
					submissionId: 'sub-1',
					body: 'Hello'
				},
				{ db: null }
			)
		);

		expect(response.status).toBe(503);
		expect(createPostMock).not.toHaveBeenCalled();
	});

	it('creates a post using the authenticated user', async () => {
		const response = await POST(
			createEvent({
				submissionId: 'sub-1',
				body: 'Hello'
			})
		);

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({
			id: 'post-1',
			authorId: 'user-123',
			submissionId: 'sub-1',
			body: 'Hello',
			mediaId: null
		});

		expect(rateLimitPostMock).toHaveBeenCalledWith({}, 'user-123');
		expect(createPostMock).toHaveBeenCalledWith(
			expect.objectContaining({
				d1: {},
				userId: 'user-123',
				input: {
					submissionId: 'sub-1',
					body: 'Hello'
				}
			})
		);
	});

	it('returns 400 for validation errors', async () => {
		createPostMock.mockRejectedValue(new PostValidationErrorMock('Post requires text or an image'));

		const response = await POST(
			createEvent({
				submissionId: 'sub-1',
				body: ''
			})
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'Post requires text or an image'
		});
	});
});
