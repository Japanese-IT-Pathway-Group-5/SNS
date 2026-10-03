import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';

const { selectMock, whereMock } = vi.hoisted(() => ({ selectMock: vi.fn(), whereMock: vi.fn() }));

vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({
			from: () => ({
				innerJoin: () => ({
					where: (condition: unknown) => {
						whereMock(condition);
						return {
							orderBy: () => ({
								limit: () => selectMock()
							})
						};
					}
				})
			})
		})
	})
}));

import { decodeCursor } from '$lib/server/http/pagination';
import { listPosts } from './list';

describe('listPosts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns visible posts and a cursor when another page exists', async () => {
		const createdAt = new Date('2026-09-01T00:00:00.000Z');

		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-2',
				authorName: 'Aiko',
				submissionId: 'sub-1',
				body: 'One',
				mediaId: null,
				createdAt
			},
			{
				id: 'post-2',
				authorId: 'user-3',
				authorName: 'Ben',
				submissionId: 'sub-2',
				body: 'Two',
				mediaId: null,
				createdAt
			},
			{
				id: 'post-3',
				authorId: 'user-4',
				authorName: 'Kai',
				submissionId: 'sub-3',
				body: 'Three',
				mediaId: null,
				createdAt
			}
		]);

		const result = await listPosts({
			d1: {} as D1Database,
			options: {
				limit: 2
			}
		});

		expect(result.items).toHaveLength(2);
		expect(result.items[0]?.id).toBe('post-1');
		expect(result.items[1]?.id).toBe('post-2');
		expect(typeof result.nextCursor).toBe('string');
		expect(decodeCursor(result.nextCursor!)).toEqual({
			createdAt: createdAt.getTime(),
			id: 'post-2'
		});
	});

	it('returns no cursor on the final page', async () => {
		selectMock.mockResolvedValueOnce([
			{
				id: 'post-1',
				authorId: 'user-2',
				authorName: 'Aiko',
				submissionId: 'sub-1',
				body: 'One',
				mediaId: null,
				createdAt: new Date('2026-09-01T00:00:00.000Z')
			}
		]);

		const result = await listPosts({
			d1: {} as D1Database
		});

		expect(result.items).toHaveLength(1);
		expect(result.nextCursor).toBeNull();
	});

	it('binds search text literally while preserving the hidden-post filter', async () => {
		selectMock.mockResolvedValueOnce([]);
		const search = "%_' OR 1=1 --";
		await listPosts({ d1: {} as D1Database, options: { search } });
		const query = new SQLiteSyncDialect().sqlToQuery(whereMock.mock.calls[0][0]);
		expect(query.sql).toContain('"post"."hidden_at" is null');
		expect(query.params).toEqual([search]);
		expect(query.sql).not.toContain(search);
	});

	it('rejects oversized search input at the domain boundary', async () => {
		await expect(
			listPosts({ d1: {} as D1Database, options: { search: 'a'.repeat(121) } })
		).rejects.toThrow();
		expect(selectMock).not.toHaveBeenCalled();
	});
});
