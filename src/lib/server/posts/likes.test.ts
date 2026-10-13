import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SQL } from 'drizzle-orm';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';

const { visiblePostMock, insertMock, deleteMock, queryConditions } = vi.hoisted(() => ({
	visiblePostMock: vi.fn(),
	insertMock: vi.fn(),
	deleteMock: vi.fn(),
	queryConditions: [] as SQL[]
}));

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({
			from: () => ({
				where: (condition: SQL) => {
					queryConditions.push(condition);
					return { limit: () => visiblePostMock() };
				}
			})
		}),
		insert: () => ({
			values: (values: unknown) => ({
				onConflictDoNothing: () => insertMock(values)
			})
		}),
		delete: () => ({
			where: (condition: SQL) => {
				queryConditions.push(condition);
				return deleteMock();
			}
		})
	})
}));

import { LikePostNotFoundError, setPostLike } from './likes';

describe('setPostLike', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		queryConditions.length = 0;
		visiblePostMock.mockResolvedValue([{ id: 'post-1' }]);
	});

	it('creates an idempotent private like only for a visible post', async () => {
		insertMock.mockResolvedValue(undefined);
		await expect(
			setPostLike({
				d1: {} as D1Database,
				postId: 'post-1',
				userId: 'user-1',
				liked: true
			})
		).resolves.toEqual({ postId: 'post-1', liked: true });

		expect(insertMock).toHaveBeenCalledWith({ postId: 'post-1', userId: 'user-1' });
		expect(new SQLiteSyncDialect().sqlToQuery(queryConditions[0]!).sql).toContain(
			'"post"."hidden_at" is null'
		);
	});

	it('rejects hidden posts without changing like state', async () => {
		visiblePostMock.mockResolvedValue([]);

		await expect(
			setPostLike({
				d1: {} as D1Database,
				postId: 'hidden-post',
				userId: 'user-1',
				liked: true
			})
		).rejects.toBeInstanceOf(LikePostNotFoundError);

		expect(insertMock).not.toHaveBeenCalled();
		expect(deleteMock).not.toHaveBeenCalled();
	});

	it('removes only the requesting user’s like', async () => {
		deleteMock.mockResolvedValue(undefined);

		await expect(
			setPostLike({
				d1: {} as D1Database,
				postId: 'post-1',
				userId: 'user-1',
				liked: false
			})
		).resolves.toEqual({ postId: 'post-1', liked: false });

		const query = new SQLiteSyncDialect().sqlToQuery(queryConditions[1]!);
		expect(query.sql).toContain('"post_like"."post_id" = ?');
		expect(query.sql).toContain('"post_like"."user_id" = ?');
		expect(query.params).toEqual(['post-1', 'user-1']);
		expect(deleteMock).toHaveBeenCalledOnce();
	});
});
