import { describe, expect, it, vi } from 'vitest';
import { uploadPhoto } from './photo-upload';

describe('uploadPhoto', () => {
	it('generates a server-controlled image key and uploads the file', async () => {
		const bucket = {
			put: vi.fn().mockResolvedValue({}),
			delete: vi.fn().mockResolvedValue(undefined)
		};

		const file = new File(['fake image data'], 'profile.jpg', {
			type: 'image/jpeg'
		});

		const imageKey = await uploadPhoto(bucket, file);

		expect(imageKey).toMatch(/^images\/[0-9a-f-]{36}$/);
		expect(bucket.put).toHaveBeenCalledTimes(1);

		const [key, body, options] = bucket.put.mock.calls[0];

		expect(key).toBe(imageKey);
		expect(body).toBeInstanceOf(ReadableStream);
		expect(options).toEqual({
			httpMetadata: {
				contentType: 'image/jpeg'
			}
		});
	});

	it('propagates an R2 upload failure', async () => {
		const bucket = {
			put: vi.fn().mockRejectedValue(new Error('R2 unavailable')),
			delete: vi.fn().mockResolvedValue(undefined)
		};

		const file = new File(['fake image data'], 'profile.jpg', {
			type: 'image/jpeg'
		});

		await expect(uploadPhoto(bucket, file)).rejects.toThrow('R2 unavailable');
	});
});
