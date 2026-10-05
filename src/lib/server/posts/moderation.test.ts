import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ModerationConflictError,
	ModerationNotFoundError,
	ModerationValidationError,
	moderatePost
} from './moderation';

const { selectMock, updateReturningMock, insertMock, requireModeratorMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	updateReturningMock: vi.fn(),
	insertMock: vi.fn(),
	requireModeratorMock: vi.fn()
}));

const mockD1 = {} as D1Database;

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({
			from: () => ({
				where: () => ({
					limit: selectMock
				})
			})
		}),
		update: () => ({
			set: () => ({
				where: () => ({
					returning: updateReturningMock
				})
			})
		}),
		insert: () => ({
			values: insertMock
		})
	})
}));

vi.mock('$lib/server/auth/authorization', () => ({
	requireModerator: requireModeratorMock
}));

describe('moderatePost', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		requireModeratorMock.mockResolvedValue({
			id: 'membership-1',
			userId: 'moderator-1',
			role: 'moderator'
		});

		updateReturningMock.mockResolvedValue([{ id: 'post-1' }]);
		insertMock.mockResolvedValue(undefined);
	});

	it('requires moderator authorization', async () => {
		requireModeratorMock.mockRejectedValueOnce(new Error('Moderator permission required'));

		await expect(
			moderatePost({
				d1: mockD1,
				moderatorId: 'user-1',
				postId: 'post-1',
				action: 'hide',
				reason: 'Spam'
			})
		).rejects.toThrow('Moderator permission required');
	});

	it('rejects an empty reason', async () => {
		await expect(
			moderatePost({
				d1: mockD1,
				moderatorId: 'moderator-1',
				postId: 'post-1',
				action: 'hide',
				reason: '   '
			})
		).rejects.toBeInstanceOf(ModerationValidationError);
	});

	it('rejects an oversized reason', async () => {
		await expect(
			moderatePost({
				d1: mockD1,
				moderatorId: 'moderator-1',
				postId: 'post-1',
				action: 'hide',
				reason: 'x'.repeat(501)
			})
		).rejects.toBeInstanceOf(ModerationValidationError);
	});

	it('returns not found when the post does not exist (hide path)', async () => {
		updateReturningMock.mockResolvedValueOnce([]);
		selectMock.mockResolvedValueOnce([]);

		await expect(
			moderatePost({
				d1: mockD1,
				moderatorId: 'moderator-1',
				postId: 'missing',
				action: 'hide',
				reason: 'Spam'
			})
		).rejects.toBeInstanceOf(ModerationNotFoundError);
	});

	it('throws ModerationConflictError when the post is already hidden', async () => {
		updateReturningMock.mockResolvedValueOnce([]);
		selectMock.mockResolvedValueOnce([{ id: 'post-1' }]);

		await expect(
			moderatePost({
				d1: mockD1,
				moderatorId: 'moderator-1',
				postId: 'post-1',
				action: 'hide',
				reason: 'Spam'
			})
		).rejects.toBeInstanceOf(ModerationConflictError);
	});

	it('does not write an audit event when the post is already hidden', async () => {
		updateReturningMock.mockResolvedValueOnce([]);
		selectMock.mockResolvedValueOnce([{ id: 'post-1' }]);

		await expect(
			moderatePost({
				d1: mockD1,
				moderatorId: 'moderator-1',
				postId: 'post-1',
				action: 'hide',
				reason: 'Spam'
			})
		).rejects.toBeInstanceOf(ModerationConflictError);

		expect(insertMock).not.toHaveBeenCalled();
	});

	it('hides a post and records the moderation event', async () => {
		updateReturningMock.mockResolvedValueOnce([{ id: 'post-1' }]);

		const result = await moderatePost({
			d1: mockD1,
			moderatorId: 'moderator-1',
			postId: 'post-1',
			action: 'hide',
			reason: 'Spam content'
		});

		expect(result.postId).toBe('post-1');
		expect(result.action).toBe('hide');
		expect(result.hiddenAt).toBeInstanceOf(Date);
		expect(updateReturningMock).toHaveBeenCalledOnce();
		expect(insertMock).toHaveBeenCalledOnce();
	});

	it('unhides a post and records the moderation event', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				hiddenAt: new Date()
			}
		]);

		const result = await moderatePost({
			d1: mockD1,
			moderatorId: 'moderator-1',
			postId: 'post-1',
			action: 'unhide',
			reason: 'Review completed'
		});

		expect(result.postId).toBe('post-1');
		expect(result.action).toBe('unhide');
		expect(result.hiddenAt).toBeNull();
		expect(insertMock).toHaveBeenCalledOnce();
	});

	it('returns not found when the post does not exist (unhide path)', async () => {
		selectMock.mockResolvedValueOnce([]);

		await expect(
			moderatePost({
				d1: mockD1,
				moderatorId: 'moderator-1',
				postId: 'missing',
				action: 'unhide',
				reason: 'Review completed'
			})
		).rejects.toBeInstanceOf(ModerationNotFoundError);
	});
});
