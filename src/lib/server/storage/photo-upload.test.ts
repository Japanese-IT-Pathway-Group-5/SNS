import { describe, expect, it, vi } from 'vitest';
import { uploadPhoto } from './photo-upload';

describe('uploadPhoto', () => {
	it('generates a server-controlled image key and stores the detected content type', async () => {
		const bucket = {
			put: vi.fn().mockResolvedValue({}),
			delete: vi.fn().mockResolvedValue(undefined)
		};

		const file = new File(['fake image data'], 'profile.jpg', {
			type: 'image/jpeg'
		});

		// The declared type is ignored; the caller passes the type detected from the bytes.
		const imageKey = await uploadPhoto(bucket, file, 'image/png');

		expect(imageKey).toMatch(/^images\/[0-9a-f-]{36}$/);
		expect(bucket.put).toHaveBeenCalledTimes(1);

		const [key, body, options] = bucket.put.mock.calls[0];

		expect(key).toBe(imageKey);
		expect(body).toBeInstanceOf(ReadableStream);
		expect(options).toEqual({
			httpMetadata: {
				contentType: 'image/png'
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

		await expect(uploadPhoto(bucket, file, 'image/jpeg')).rejects.toThrow('R2 unavailable');
	});
});
