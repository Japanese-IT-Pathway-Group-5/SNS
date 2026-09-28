import { describe, expect, it, vi } from 'vitest';
import { RATE_LIMIT_KEYS, rateLimitPost, rateLimitUpload, type RateLimiter } from './rate-limit';

describe('rate limiting', () => {
	it('creates user-scoped keys for posts', () => {
		expect(RATE_LIMIT_KEYS.post('user-123')).toBe('post:user-123');
	});

	it('creates user-scoped keys for uploads', () => {
		expect(RATE_LIMIT_KEYS.upload('user-123')).toBe('upload:user-123');
	});

	it('allows post creation when the limiter allows the request', async () => {
		const limiter = {
			limit: vi.fn().mockResolvedValue({ success: true })
		} as RateLimiter;

		await expect(rateLimitPost(limiter, 'user-123')).resolves.toEqual({ allowed: true });
		expect(limiter.limit).toHaveBeenCalledWith({
			key: 'post:user-123'
		});
	});

	it('rejects post creation when the limiter denies the request', async () => {
		const limiter = {
			limit: vi.fn().mockResolvedValue({ success: false })
		} as RateLimiter;

		await expect(rateLimitPost(limiter, 'user-123')).resolves.toEqual({
			allowed: false,
			status: 429
		});
	});

	it('allows image upload when the limiter allows the request', async () => {
		const limiter = {
			limit: vi.fn().mockResolvedValue({ success: true })
		} as RateLimiter;

		await expect(rateLimitUpload(limiter, 'user-123')).resolves.toEqual({ allowed: true });
		expect(limiter.limit).toHaveBeenCalledWith({
			key: 'upload:user-123'
		});
	});

	it('rejects image upload when the limiter denies the request', async () => {
		const limiter = {
			limit: vi.fn().mockResolvedValue({ success: false })
		} as RateLimiter;

		await expect(rateLimitUpload(limiter, 'user-123')).resolves.toEqual({
			allowed: false,
			status: 429
		});
	});

	it('does not rate-limit when the binding is unavailable', async () => {
		await expect(rateLimitPost(undefined, 'user-123')).resolves.toEqual({ allowed: true });
		await expect(rateLimitUpload(undefined, 'user-123')).resolves.toEqual({ allowed: true });
	});
});
