import { beforeEach, describe, expect, it, vi } from 'vitest';

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('$lib/server/db', () => ({
	getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: lookup }) }) }) })
}));
import { GET } from './+server';

const id = '11111111-1111-4111-8111-111111111111';
function event(get = vi.fn()) {
	return {
		params: { photoId: id },
		platform: { env: { DB: {}, MEDIA_BUCKET: { get } } }
	} as unknown as Parameters<typeof GET>[0];
}
describe('public profile photos', () => {
	beforeEach(() => vi.clearAllMocks());
	it('does not expose an R2 object that is not a current profile photo', async () => {
		lookup.mockResolvedValue([]);
		const get = vi.fn();
		await expect(GET(event(get))).rejects.toMatchObject({ status: 404 });
		expect(get).not.toHaveBeenCalled();
	});
	it('serves a current profile image without caching removed photos', async () => {
		lookup.mockResolvedValue([{ image: `/api/profile/photo/${id}` }]);
		const get = vi.fn().mockResolvedValue({
			body: new Uint8Array([1, 2]),
			size: 2,
			httpMetadata: { contentType: 'image/png' }
		});
		const response = await GET(event(get));
		expect(response.headers.get('content-type')).toBe('image/png');
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(get).toHaveBeenCalledWith(`images/${id}`);
	});
	it('rejects HTML objects even when a profile references the key', async () => {
		lookup.mockResolvedValue([{ image: `/api/profile/photo/${id}` }]);
		await expect(
			GET(event(vi.fn().mockResolvedValue({ httpMetadata: { contentType: 'text/html' } })))
		).rejects.toMatchObject({ status: 404 });
	});
});
