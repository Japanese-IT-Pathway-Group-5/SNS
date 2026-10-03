import { describe, expect, it } from 'vitest';
import {
	decodeCursor,
	encodeCursor,
	parsePaginationParams,
	PaginationValidationError
} from './pagination';

describe('cursor tokens', () => {
	it('round-trips a cursor through an opaque, URL-safe token', () => {
		const cursor = { createdAt: 1788400000000, id: 'post-123' };
		const token = encodeCursor(cursor);

		expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(token).not.toContain('post-123');
		expect(decodeCursor(token)).toEqual(cursor);
	});

	it('round-trips ids containing separators and non-ASCII characters', () => {
		const cursor = { createdAt: 0, id: 'a:b/c+d=日記' };

		expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
	});

	it('rejects malformed or tampered tokens', () => {
		const invalid = [
			'',
			'not base64!',
			encodeCursor({ createdAt: 1, id: 'x' }) + '%',
			btoa('no-separator'),
			btoa(':missing-time'),
			btoa('12.5:post'),
			btoa('-1:post'),
			btoa('123:   '),
			btoa('99999999999999999999:post'),
			'A'.repeat(600)
		];

		for (const token of invalid) {
			expect(() => decodeCursor(token), token).toThrow(PaginationValidationError);
		}
	});
});

describe('parsePaginationParams', () => {
	it('returns no pagination values when parameters are absent', () => {
		const result = parsePaginationParams(new URL('https://example.com/api/posts'));

		expect(result).toEqual({
			cursor: undefined,
			limit: undefined
		});
	});

	it('parses a cursor token and limit', () => {
		const token = encodeCursor({ createdAt: 1700000000000, id: 'post-123' });
		const result = parsePaginationParams(new URL(`https://example.com/?cursor=${token}&limit=20`));

		expect(result).toEqual({
			cursor: {
				createdAt: 1700000000000,
				id: 'post-123'
			},
			limit: 20
		});
	});

	it('rejects an invalid cursor token', () => {
		expect(() => parsePaginationParams(new URL('https://example.com/?cursor=%%%'))).toThrow(
			'Invalid cursor'
		);
	});

	it('still parses the legacy cursorCreatedAt/cursorId pair', () => {
		const result = parsePaginationParams(
			new URL(
				'https://example.com/api/posts?cursorCreatedAt=1700000000000&cursorId=post-123&limit=20'
			)
		);

		expect(result).toEqual({
			cursor: {
				createdAt: 1700000000000,
				id: 'post-123'
			},
			limit: 20
		});
	});

	it('trims the cursor id', () => {
		const result = parsePaginationParams(
			new URL('https://example.com/api/posts?cursorCreatedAt=123&cursorId=%20post-123%20')
		);

		expect(result.cursor).toEqual({
			createdAt: 123,
			id: 'post-123'
		});
	});

	it('rejects an invalid cursor', () => {
		expect(() =>
			parsePaginationParams(
				new URL('https://example.com/api/posts?cursorCreatedAt=invalid&cursorId=post-123')
			)
		).toThrow(PaginationValidationError);

		expect(() =>
			parsePaginationParams(
				new URL('https://example.com/api/posts?cursorCreatedAt=123&cursorId=%20')
			)
		).toThrow('Invalid cursor');
	});

	it('rejects an invalid limit', () => {
		expect(() => parsePaginationParams(new URL('https://example.com/api/posts?limit=0'))).toThrow(
			'Invalid limit'
		);

		expect(() => parsePaginationParams(new URL('https://example.com/api/posts?limit=1.5'))).toThrow(
			'Invalid limit'
		);
	});
});
