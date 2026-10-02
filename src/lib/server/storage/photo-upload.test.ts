import { describe, expect, it, vi } from 'vitest';
import { uploadPhoto } from './photo-upload';

// Minimal valid JPEG containing a 1x1 image SOF marker.
const JPEG_1X1 = Uint8Array.from([
	0xff, 0xd8, // SOI
	0xff, 0xc0, // SOF0
	0x00, 0x0b, // segment length
	0x08,       // precision
	0x00, 0x01, // height = 1
	0x00, 0x01, // width = 1
	0x01, 0x01, 0x11, 0x00,
	0xff, 0xd9  // EOI
]);

describe('uploadPhoto', () => {
	it('generates a server-controlled image key and uploads the file', async () => {
		const bucket = {
			put: vi.fn().mockResolvedValue({}),
			get: vi.fn(),
			delete: vi.fn().mockResolvedValue(undefined)
		};

		const file = new File([JPEG_1X1], 'profile.jpg', {
			type: 'image/jpeg'
		});

		const media = await uploadPhoto(bucket, file);

		expect(media.objectKey).toMatch(/^images\/[0-9a-f-]{36}$/);
		expect(media.contentType).toBe('image/jpeg');
		expect(media.byteSize).toBe(JPEG_1X1.byteLength);
		expect(media.width).toBe(1);
		expect(media.height).toBe(1);

		expect(bucket.put).toHaveBeenCalledTimes(1);

		const [key, body, options] = bucket.put.mock.calls[0];

		expect(key).toBe(media.objectKey);
                expect(body).toBeInstanceOf(Uint8Array);
                expect(body).toEqual(JPEG_1X1);
		expect(options).toEqual({
			httpMetadata: {
				contentType: 'image/jpeg'
			}
		});
	});

	it('propagates an R2 upload failure', async () => {
		const bucket = {
			put: vi.fn().mockRejectedValue(new Error('R2 unavailable')),
			get: vi.fn(),
			delete: vi.fn().mockResolvedValue(undefined)
		};

		const file = new File([JPEG_1X1], 'profile.jpg', {
			type: 'image/jpeg'
		});

		await expect(uploadPhoto(bucket, file)).rejects.toThrow('R2 unavailable');
	});
});
