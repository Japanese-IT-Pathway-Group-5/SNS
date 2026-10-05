import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPostMock, rateLimitPostMock, listPostsMock, PostValidationErrorMock } = vi.hoisted(() => ({
	createPostMock: vi.fn(),
	rateLimitPostMock: vi.fn(),
	listPostsMock: vi.fn(),
	PostValidationErrorMock: class PostValidationError extends Error {}
}));

vi.mock('$lib/server/posts/create', () => ({
	createPost: createPostMock,
	PostValidationError: PostValidationErrorMock
}));

vi.mock('$lib/server/posts/list', () => ({
	listPosts: listPostsMock
}));

vi.mock('$lib/server/security/rate-limit', () => ({
	rateLimitPost: rateLimitPostMock
}));

import { GET, POST } from './+server';

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

describe('GET /api/posts', () => {
	beforeEach(() => {
		listPostsMock.mockReset();
	});

	function createGetEvent(
		query = '',
		options: {
			user?: object | null;
			db?: object | null;
		} = {}
	) {
		return {
			url: new URL(`http://localhost/api/posts${query ? `?${query}` : ''}`),
			locals: {
				user:
					options.user === undefined
						? { id: 'user-123', name: 'Test User' }
						: options.user,
				session: null
			},
			platform: {
				env: {
					DB: options.db === undefined ? {} : options.db
				}
			}
		} as unknown as Parameters<typeof GET>[0];
	}

	it('returns 503 if database is not configured', async () => {
		const response = await GET(createGetEvent('', { db: null }));
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Database is not configured' });
	});

	it('returns 400 if search query exceeds limit', async () => {
		const response = await GET(createGetEvent(`q=${'a'.repeat(121)}`));
		expect(response.status).toBe(400);
	});

	it('returns 401 if journal requested without user', async () => {
		const response = await GET(createGetEvent('journal=1', { user: null }));
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});

	it('returns posts and nextCursor successfully', async () => {
		listPostsMock.mockResolvedValue({
			items: [{ id: 'p1', body: 'Hello' }],
			nextCursor: 'next-123'
		});

		const response = await GET(createGetEvent('q=test'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			items: [{ id: 'p1', body: 'Hello' }],
			nextCursor: 'next-123'
		});
		expect(listPostsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				d1: {},
				options: expect.objectContaining({ search: 'test' })
			})
		);
	});
});
