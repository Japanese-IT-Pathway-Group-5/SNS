import { describe, expect, it, vi } from 'vitest';
import { getMembership, requireMembership, requireModerator } from './authorization';

const selectMock = vi.fn();

const mockD1 = {} as D1Database;

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => selectMock()
				})
			})
		})
	})
}));

describe('authorization', () => {
	it('returns null when the user has no membership', async () => {
		selectMock.mockResolvedValueOnce([]);

		await expect(getMembership(mockD1, 'user-1')).resolves.toBeNull();
	});

	it('returns the user membership', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'membership-1',
				userId: 'user-1',
				role: 'member'
			}
		]);

		await expect(getMembership(mockD1, 'user-1')).resolves.toEqual({
			id: 'membership-1',
			userId: 'user-1',
			role: 'member'
		});
	});

	it('requires membership', async () => {
		selectMock.mockResolvedValueOnce([]);

		await expect(requireMembership(mockD1, 'user-1')).rejects.toThrow('Membership required');
	});

	it('allows a moderator', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'membership-1',
				userId: 'user-1',
				role: 'moderator'
			}
		]);

		await expect(requireModerator(mockD1, 'user-1')).resolves.toEqual({
			id: 'membership-1',
			userId: 'user-1',
			role: 'moderator'
		});
	});

	it('rejects a normal member as moderator', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'membership-1',
				userId: 'user-1',
				role: 'member'
			}
		]);

		await expect(requireModerator(mockD1, 'user-1')).rejects.toThrow(
			'Moderator permission required'
		);
	});
});
