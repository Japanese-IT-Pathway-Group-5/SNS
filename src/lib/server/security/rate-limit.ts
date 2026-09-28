export interface RateLimiter {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

export const RATE_LIMIT_KEYS = {
	post: (userId: string) => `post:${userId}`,
	upload: (userId: string) => `upload:${userId}`
} as const;

export type RateLimitResult = { allowed: true } | { allowed: false; status: 429 };

async function checkRateLimit(
	limiter: RateLimiter | undefined,
	key: string
): Promise<RateLimitResult> {
	if (!limiter) {
		return { allowed: true };
	}

	const result = await limiter.limit({ key });

	return result.success ? { allowed: true } : { allowed: false, status: 429 };
}

export function rateLimitPost(
	limiter: RateLimiter | undefined,
	userId: string
): Promise<RateLimitResult> {
	return checkRateLimit(limiter, RATE_LIMIT_KEYS.post(userId));
}

export function rateLimitUpload(
	limiter: RateLimiter | undefined,
	userId: string
): Promise<RateLimitResult> {
	return checkRateLimit(limiter, RATE_LIMIT_KEYS.upload(userId));
}
