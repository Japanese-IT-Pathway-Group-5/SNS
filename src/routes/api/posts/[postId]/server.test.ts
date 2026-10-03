import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	getPostMock,
	updatePostMock,
	deletePostMock,
	PostNotFoundErrorMock,
	PostForbiddenErrorMock,
	PostValidationErrorMock
} = vi.hoisted(() => ({
	getPostMock: vi.fn(),
	updatePostMock: vi.fn(),
	deletePostMock: vi.fn(),
	PostNotFoundErrorMock: class PostNotFoundError extends Error {},
	PostForbiddenErrorMock: class PostForbiddenError extends Error {},
	PostValidationErrorMock: class PostValidationError extends Error {}
}));

vi.mock('$lib/server/posts/get', () => ({
	getPost: getPostMock,
	PostNotFoundError: PostNotFoundErrorMock
}));

vi.mock('$lib/server/posts/update', () => ({
	updatePost: updatePostMock,
	PostForbiddenError: PostForbiddenErrorMock,
	PostNotFoundError: PostNotFoundErrorMock,
	PostValidationError: PostValidationErrorMock
}));

vi.mock('$lib/server/posts/delete', () => ({
	deletePost: deletePostMock,
	PostForbiddenError: PostForbiddenErrorMock,
	PostNotFoundError: PostNotFoundErrorMock,
	PostValidationError: PostValidationErrorMock
}));

import { DELETE, GET, PATCH } from './+server';

const makeGetEvent = (options: {
	user?: { id: string } | null;
	db?: D1Database;
	postId?: string;
}) =>
	({
		locals: {
			user: options.user === undefined ? { id: 'user-1' } : options.user
		},
		params: {
			postId: options.postId
		},
		platform: {
			env: {
				DB: options.db === undefined ? ({} as D1Database) : options.db
			}
		}
	}) as Parameters<typeof GET>[0];

const makePatchEvent = (options: {
	user?: { id: string } | null;
	db?: D1Database | null;
	postId?: string;
	body?: unknown;
	invalidJson?: boolean;
}) =>
	({
		request: {
			json: async () => {
				if (options.invalidJson) {
					throw new Error('Invalid JSON');
				}
				return options.body !== undefined ? options.body : { body: 'Updated text' };
			}
		} as unknown as Request,
		locals: {
			user: options.user === undefined ? { id: 'user-1' } : options.user
		},
		params: {
			postId: options.postId === undefined ? 'post-1' : options.postId
		},
		platform: {
			env: {
				DB: options.db === null ? undefined : (options.db ?? ({} as D1Database))
			}
		}
	}) as unknown as Parameters<typeof PATCH>[0];

const makeDeleteEvent = (options: {
	user?: { id: string } | null;
	db?: D1Database | null;
	postId?: string;
}) =>
	({
		locals: {
			user: options.user === undefined ? { id: 'user-1' } : options.user
		},
		params: {
			postId: options.postId === undefined ? 'post-1' : options.postId
		},
		platform: {
			env: {
				DB: options.db === null ? undefined : (options.db ?? ({} as D1Database))
			}
		}
	}) as unknown as Parameters<typeof DELETE>[0];

describe('/api/posts/[postId]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/posts/[postId]', () => {
		it('returns 503 when the database is unavailable', async () => {
			const response = await GET({
				locals: {
					user: { id: 'user-1' }
				},
				params: {
					postId: 'post-1'
				},
				platform: {
					env: {}
				}
			} as Parameters<typeof GET>[0]);

			expect(response.status).toBe(503);
		});

		it('returns 400 when postId is missing', async () => {
			const response = await GET(
				makeGetEvent({
					postId: ''
				})
			);

			expect(response.status).toBe(400);
		});

		it('returns 404 for a hidden or missing post', async () => {
			getPostMock.mockRejectedValueOnce(new PostNotFoundErrorMock('Post not found'));

			const response = await GET(
				makeGetEvent({
					postId: 'hidden-post'
				})
			);

			expect(response.status).toBe(404);
		});

		it('returns a visible post', async () => {
			getPostMock.mockResolvedValueOnce({
				id: 'post-1',
				authorId: 'user-2',
				authorName: 'Aiko',
				authorImage: null,
				submissionId: 'sub-1',
				body: 'Hello',
				mediaId: null,
				createdAt: new Date('2026-09-01T00:00:00.000Z')
			});

			const response = await GET(
				makeGetEvent({
					user: null,
					postId: 'post-1'
				})
			);

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toMatchObject({
				id: 'post-1',
				authorId: 'user-2',
				body: 'Hello'
			});
		});
	});

	describe('PATCH /api/posts/[postId]', () => {
		it('returns 401 when unauthenticated', async () => {
			const response = await PATCH(makePatchEvent({ user: null }));
			expect(response.status).toBe(401);
		});

		it('returns 503 when database is unavailable', async () => {
			const response = await PATCH(makePatchEvent({ db: null }));
			expect(response.status).toBe(503);
		});

		it('returns 400 when postId is missing', async () => {
			const response = await PATCH(makePatchEvent({ postId: '' }));
			expect(response.status).toBe(400);
		});

		it('returns 400 when JSON body is invalid', async () => {
			const response = await PATCH(makePatchEvent({ invalidJson: true }));
			expect(response.status).toBe(400);
		});

		it('returns 400 on PostValidationError', async () => {
			updatePostMock.mockRejectedValueOnce(
				new PostValidationErrorMock('Post requires text or an image')
			);
			const response = await PATCH(makePatchEvent({ body: { body: '' } }));
			expect(response.status).toBe(400);
		});

		it('returns 403 on PostForbiddenError', async () => {
			updatePostMock.mockRejectedValueOnce(
				new PostForbiddenErrorMock('You are not authorized to edit this post')
			);
			const response = await PATCH(makePatchEvent({}));
			expect(response.status).toBe(403);
		});

		it('returns 404 on PostNotFoundError', async () => {
			updatePostMock.mockRejectedValueOnce(new PostNotFoundErrorMock('Post not found'));
			const response = await PATCH(makePatchEvent({}));
			expect(response.status).toBe(404);
		});

		it('returns 200 on successful update', async () => {
			updatePostMock.mockResolvedValueOnce({
				id: 'post-1',
				authorId: 'user-1',
				submissionId: 'sub-1',
				body: 'Updated text',
				mediaId: null,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			const response = await PATCH(makePatchEvent({ body: { body: 'Updated text' } }));
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toMatchObject({
				id: 'post-1',
				body: 'Updated text'
			});
		});
	});

	describe('DELETE /api/posts/[postId]', () => {
		it('returns 401 when unauthenticated', async () => {
			const response = await DELETE(makeDeleteEvent({ user: null }));
			expect(response.status).toBe(401);
		});

		it('returns 503 when database is unavailable', async () => {
			const response = await DELETE(makeDeleteEvent({ db: null }));
			expect(response.status).toBe(503);
		});

		it('returns 400 when postId is missing', async () => {
			const response = await DELETE(makeDeleteEvent({ postId: '' }));
			expect(response.status).toBe(400);
		});

		it('returns 403 on PostForbiddenError', async () => {
			deletePostMock.mockRejectedValueOnce(
				new PostForbiddenErrorMock('You are not authorized to delete this post')
			);
			const response = await DELETE(makeDeleteEvent({}));
			expect(response.status).toBe(403);
		});

		it('returns 404 on PostNotFoundError', async () => {
			deletePostMock.mockRejectedValueOnce(new PostNotFoundErrorMock('Post not found'));
			const response = await DELETE(makeDeleteEvent({}));
			expect(response.status).toBe(404);
		});

		it('returns 200 on successful deletion', async () => {
			deletePostMock.mockResolvedValueOnce({
				id: 'post-1',
				success: true
			});
			const response = await DELETE(makeDeleteEvent({}));
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toMatchObject({
				id: 'post-1',
				success: true
			});
		});
	});
});
