import { describe, expect, it } from 'vitest';
import { parsePaginationParams, PaginationValidationError } from './pagination';

describe('parsePaginationParams', () => {
	it('returns no pagination values when parameters are absent', () => {
		const result = parsePaginationParams(new URL('https://example.com/api/posts'));

		expect(result).toEqual({
			cursor: undefined,
			limit: undefined
		});
	});

	it('parses a valid cursor and limit', () => {
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
