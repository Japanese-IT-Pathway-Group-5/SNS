import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectMock, insertMock, requireMembershipMock, withPhotoCleanupMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	insertMock: vi.fn(),
	requireMembershipMock: vi.fn(),
	withPhotoCleanupMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => selectMock()
				})
			})
		}),
		insert: () => ({
			values: insertMock
		})
	})
}));

vi.mock('$lib/server/auth/authorization', () => ({
	requireMembership: requireMembershipMock
}));

vi.mock('$lib/server/storage/with-photo-cleanup', () => ({
	withPhotoCleanup: withPhotoCleanupMock
}));

import { createPost } from './create';

describe('createPost', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('requires membership', async () => {
		requireMembershipMock.mockRejectedValueOnce(new Error('Membership required'));

		await expect(
			createPost({
				d1: {} as D1Database,
				userId: 'user-1',
				input: {
					submissionId: 'sub-1',
					body: 'Hello'
				}
			})
		).rejects.toThrow('Membership required');
	});

	it('rejects empty text-only posts', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		await expect(
			createPost({
				d1: {} as D1Database,
				userId: 'user-1',
				input: {
					submissionId: 'sub-1',
					body: ''
				}
			})
		).rejects.toThrow('Post requires text or an image');

		expect(insertMock).not.toHaveBeenCalled();
	});

	it('does not accept a client-supplied author ID', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		selectMock.mockResolvedValueOnce([]);
		insertMock.mockResolvedValueOnce(undefined);

		await createPost({
			d1: {} as D1Database,
			userId: 'user-1',
			input: {
				submissionId: 'sub-1',
				body: 'Hello',
				mediaId: null
			}
		});

		expect(insertMock).toHaveBeenCalledWith(
			expect.objectContaining({
				authorId: 'user-1'
			})
		);
	});

	it('returns an existing post for the same user-scoped submission ID', async () => {
		requireMembershipMock.mockResolvedValueOnce({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});

		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-1',
				submissionId: 'sub-1',
				body: 'Original',
				mediaId: null
			}
		]);

		const result = await createPost({
			d1: {} as D1Database,
			userId: 'user-1',
			input: {
				submissionId: 'sub-1',
				body: 'Retry'
			}
		});

		expect(result).toEqual({
			id: 'post-1',
			authorId: 'user-1',
			submissionId: 'sub-1',
			body: 'Original',
			mediaId: null
		});

		expect(insertMock).not.toHaveBeenCalled();
	});
});
