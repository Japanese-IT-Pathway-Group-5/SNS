import { describe, expect, it } from 'vitest';
import { MAX_POST_LENGTH, MAX_REPLY_LENGTH, postInputSchema, replyInputSchema } from './posts';

describe('post validation', () => {
	it('accepts a post at the Unicode code-point limit', () => {
		const body = '😀'.repeat(MAX_POST_LENGTH);

		expect(
			postInputSchema.safeParse({
				submissionId: 'sub-1',
				body
			}).success
		).toBe(true);
	});

	it('rejects a post above the Unicode code-point limit', () => {
		const body = '😀'.repeat(MAX_POST_LENGTH + 1);

		expect(
			postInputSchema.safeParse({
				submissionId: 'sub-1',
				body
			}).success
		).toBe(false);
	});

	it('accepts an image-only post', () => {
		expect(
			postInputSchema.safeParse({
				submissionId: 'sub-1',
				body: '',
				mediaId: 'images/test-key'
			}).success
		).toBe(true);
	});

	it('rejects an invalid image key', () => {
		expect(
			postInputSchema.safeParse({
				submissionId: 'sub-1',
				body: 'Hello',
				mediaId: '../secret'
			}).success
		).toBe(false);
	});

	it('accepts a reply at the Unicode code-point limit', () => {
		const body = '😀'.repeat(MAX_REPLY_LENGTH);

		expect(replyInputSchema.safeParse({ body }).success).toBe(true);
	});

	it('rejects a reply above the Unicode code-point limit', () => {
		const body = '😀'.repeat(MAX_REPLY_LENGTH + 1);

		expect(replyInputSchema.safeParse({ body }).success).toBe(false);
	});
});
