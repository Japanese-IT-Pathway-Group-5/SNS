import { expect, it, vi } from 'vitest';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
const { select, where, limit } = vi.hoisted(() => ({
	select: vi.fn(),
	where: vi.fn(),
	limit: vi.fn()
}));
vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: (fields: unknown) => {
			select(fields);
			return {
				from: () => ({
					where: (condition: unknown) => {
						where(condition);
						return { limit };
					}
				})
			};
		}
	})
}));
import { getPublicProfile } from './get';
it('selects only public fields and binds the profile id', async () => {
	limit.mockResolvedValue([
		{ id: 'a', name: 'Aiko', image: null, description: null, banner: null }
	]);
	expect(await getPublicProfile({} as D1Database, 'a')).toEqual({
		id: 'a',
		name: 'Aiko',
		image: null,
		description: '',
		banner: ''
	});
	expect(Object.keys(select.mock.calls[0][0])).toEqual([
		'id',
		'name',
		'image',
		'description',
		'banner'
	]);
	expect(new SQLiteSyncDialect().sqlToQuery(where.mock.calls[0][0]).params).toEqual(['a']);
});
it('returns null for nonexistent accounts', async () => {
	limit.mockResolvedValue([]);
	expect(await getPublicProfile({} as D1Database, 'missing')).toBeNull();
});
