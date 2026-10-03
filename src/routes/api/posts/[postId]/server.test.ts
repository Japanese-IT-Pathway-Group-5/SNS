import { describe, expect, it, vi } from 'vitest';

const { getPostMock } = vi.hoisted(() => ({
	getPostMock: vi.fn()
}));

vi.mock('$lib/server/posts/get', () => ({
	getPost: getPostMock,
	PostNotFoundError: class PostNotFoundError extends Error {}
}));

import { GET } from './+server';

const makeEvent = (options: { user?: { id: string } | null; db?: D1Database; postId?: string }) =>
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

describe('GET /api/posts/[postId]', () => {
	it('returns 401 for unauthenticated users', async () => {
		const response = await GET(
			makeEvent({
				user: null
			})
		);

		expect(response.status).toBe(401);
	});

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
			makeEvent({
				postId: ''
			})
		);

		expect(response.status).toBe(400);
	});

	it('returns 404 for a hidden or missing post', async () => {
		getPostMock.mockRejectedValueOnce(
			new (await import('$lib/server/posts/get')).PostNotFoundError('Post not found')
		);

		const response = await GET(
			makeEvent({
				postId: 'hidden-post'
			})
		);

		expect(response.status).toBe(404);
	});

	it('returns 403 when membership is required', async () => {
		getPostMock.mockRejectedValueOnce(new Error('Membership required'));

		const response = await GET(
			makeEvent({
				postId: 'post-1'
			})
		);

		expect(response.status).toBe(403);
	});

	it('returns a visible post', async () => {
		getPostMock.mockResolvedValueOnce({
			id: 'post-1',
			authorId: 'user-2',
			authorName: 'Aiko',
			submissionId: 'sub-1',
			body: 'Hello',
			mediaId: null,
			createdAt: new Date('2026-09-01T00:00:00.000Z')
		});

		const response = await GET(
			makeEvent({
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
