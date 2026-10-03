import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import type { SQL } from 'drizzle-orm';

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));
vi.mock('$lib/server/db', () => ({ getDb: () => ({ all: queryMock }) }));
import { listTrendingJournals } from './trending';

const now = new Date('2026-10-03T12:00:00Z');
const day = 24 * 60 * 60 * 1000;
let database: DatabaseSync;

beforeEach(() => {
	database = new DatabaseSync(':memory:');
	database.exec(
		'CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT, image TEXT); CREATE TABLE post (id TEXT PRIMARY KEY, author_id TEXT, body TEXT, created_at INTEGER, hidden_at INTEGER)'
	);
	queryMock.mockImplementation(async (statement: SQL) => {
		const query = new SQLiteSyncDialect().sqlToQuery(statement);
		return database.prepare(query.sql).all(...(query.params as SQLInputValue[]));
	});
});
afterEach(() => {
	database.close();
	vi.clearAllMocks();
});

function author(id: string) {
	database.prepare('INSERT INTO user VALUES (?, ?, NULL)').run(id, `Author ${id}`);
}
function post(id: string, authorId: string, age: number, hidden = false) {
	database
		.prepare('INSERT INTO post VALUES (?, ?, ?, ?, ?)')
		.run(id, authorId, `Moment ${id}`, now.getTime() - age * day, hidden ? now.getTime() : null);
}

describe('trending journals', () => {
	it('ranks recent visible activity and returns one latest entry per author', async () => {
		author('a');
		author('b');
		author('hidden');
		author('old');
		post('a-older', 'a', 3);
		post('a-latest', 'a', 1);
		post('b-latest', 'b', 0.5);
		post('b-hidden', 'b', 0.1, true);
		post('hidden-only', 'hidden', 0, true);
		post('too-old', 'old', 8);
		const result = await listTrendingJournals({ d1: {} as D1Database, now });
		expect(result.map((entry) => entry.id)).toEqual(['a-latest', 'b-latest']);
		expect(Object.keys(result[0]).sort()).toEqual(
			['id', 'authorId', 'authorName', 'authorImage', 'body'].sort()
		);
	});

	it('bounds the panel to five journals and resolves timestamp ties consistently', async () => {
		for (let index = 0; index < 7; index++) {
			author(String(index));
			post(`entry-${index}`, String(index), 1);
		}
		post('entry-z', '0', 1);
		const result = await listTrendingJournals({ d1: {} as D1Database, now });
		expect(result).toHaveLength(5);
		expect(result[0].id).toBe('entry-z');
		expect(new Set(result.map((entry) => entry.authorId)).size).toBe(5);
	});
});
