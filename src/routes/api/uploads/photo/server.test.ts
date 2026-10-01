import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server';
import { rateLimitUpload } from '$lib/server/security/rate-limit';
import { uploadPhoto } from '$lib/server/storage/photo-upload';
import { MAX_PHOTO_BYTES, MAX_PHOTO_REQUEST_BYTES } from '$lib/validation/photo-upload';

vi.mock('$lib/server/security/rate-limit', () => ({
	rateLimitUpload: vi.fn()
}));

vi.mock('$lib/server/storage/photo-upload', () => ({
	uploadPhoto: vi.fn()
}));

const mockedRateLimitUpload = vi.mocked(rateLimitUpload);
const mockedUploadPhoto = vi.mocked(uploadPhoto);

const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const WEBP_HEADER = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

/** Builds a file of `size` bytes that starts with the given signature. */
function imageFile(signature: number[], name: string, type: string, size = 64): File {
	const bytes = new Uint8Array(size);
	bytes.set(signature);

	return new File([bytes], name, { type });
}

function createRequest(body?: BodyInit, contentType?: string): Request {
	return new Request('http://localhost/api/uploads/photo', {
		method: 'POST',
		body,
		headers: contentType ? { 'content-type': contentType } : undefined
	});
}

function createAuthenticatedEvent(
	request: Request,
	options: {
		user?: object | null;
		mediaBucket?: object | null;
	} = {}
) {
	return {
		request,
		locals: {
			user:
				options.user === undefined
					? {
							id: 'user-123',
							name: 'Test User',
							email: 'test@example.com',
							emailVerified: true,
							image: null,
							createdAt: new Date(),
							updatedAt: new Date()
						}
					: options.user,
			session: null
		},
		platform: {
			env: {
				UPLOAD_RATE_LIMITER: {},
				MEDIA_BUCKET: options.mediaBucket === undefined ? {} : options.mediaBucket
			}
		}
	} as unknown as Parameters<typeof POST>[0];
}

/**
 * Serializes the form the way a browser does, so the request carries a
 * multipart boundary and an accurate Content-Length header.
 */
async function createMultipartRequest(file?: File): Promise<Request> {
	const formData = new FormData();

	if (file) {
		formData.append('file', file);
	}

	const encoded = new Response(formData);
	const body = await encoded.arrayBuffer();

	return new Request('http://localhost/api/uploads/photo', {
		method: 'POST',
		body,
		headers: {
			'content-type': encoded.headers.get('content-type') ?? '',
			'content-length': String(body.byteLength)
		}
	});
}

describe('POST /api/uploads/photo', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockedRateLimitUpload.mockResolvedValue({
			allowed: true
		});

		mockedUploadPhoto.mockResolvedValue('images/test-image-key');
	});

	it('returns 401 when the user is not authenticated', async () => {
		const request = createRequest('', 'multipart/form-data');

		const event = createAuthenticatedEvent(request, {
			user: null
		});

		const response = await POST(event);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error: 'Unauthorized'
		});

		expect(mockedRateLimitUpload).not.toHaveBeenCalled();
		expect(mockedUploadPhoto).not.toHaveBeenCalled();
	});

	it('returns 429 when the upload rate limit is exceeded', async () => {
		mockedRateLimitUpload.mockResolvedValue({
			allowed: false,
			status: 429
		});

		const request = createRequest('', 'multipart/form-data');
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({
			error: 'Too many upload requests'
		});

		expect(mockedUploadPhoto).not.toHaveBeenCalled();
	});

	it('returns 400 for a non-multipart request', async () => {
		const request = createRequest('{}', 'application/json');
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'Content-Type must be multipart/form-data'
		});

		expect(mockedUploadPhoto).not.toHaveBeenCalled();
	});

	describe('request size', () => {
		it('returns 413 for an oversized Content-Length without parsing the body', async () => {
			const request = createRequest('tiny body', 'multipart/form-data; boundary=x');
			request.headers.set('content-length', String(MAX_PHOTO_REQUEST_BYTES + 1));
			const formData = vi.spyOn(request, 'formData');

			const response = await POST(createAuthenticatedEvent(request));

			expect(response.status).toBe(413);
			expect(await response.json()).toEqual({ error: 'Image is too large' });
			expect(formData).not.toHaveBeenCalled();
			expect(mockedUploadPhoto).not.toHaveBeenCalled();
		});

		it('returns 411 when Content-Length is missing, without parsing the body', async () => {
			const request = createRequest('tiny body', 'multipart/form-data; boundary=x');
			const formData = vi.spyOn(request, 'formData');

			const response = await POST(createAuthenticatedEvent(request));

			expect(response.status).toBe(411);
			expect(await response.json()).toEqual({ error: 'Content-Length header is required' });
			expect(formData).not.toHaveBeenCalled();
		});

		it('returns 400 for a malformed Content-Length', async () => {
			const request = createRequest('tiny body', 'multipart/form-data; boundary=x');
			request.headers.set('content-length', 'abc');

			const response = await POST(createAuthenticatedEvent(request));

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: 'Invalid Content-Length header' });
		});

		it('accepts an image exactly at the size limit', async () => {
			const file = imageFile(JPEG_HEADER, 'photo.jpg', 'image/jpeg', MAX_PHOTO_BYTES);

			const response = await POST(createAuthenticatedEvent(await createMultipartRequest(file)));

			expect(response.status).toBe(201);
			expect(mockedUploadPhoto).toHaveBeenCalledTimes(1);
		});

		it('returns 413 for an image one byte over the limit', async () => {
			const file = imageFile(JPEG_HEADER, 'photo.jpg', 'image/jpeg', MAX_PHOTO_BYTES + 1);

			const response = await POST(createAuthenticatedEvent(await createMultipartRequest(file)));

			expect(response.status).toBe(413);
			expect(await response.json()).toEqual({ error: 'Image is too large' });
			expect(mockedUploadPhoto).not.toHaveBeenCalled();
		});
	});

	it('returns 400 when the file field is missing', async () => {
		const request = await createMultipartRequest();
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'An image file is required'
		});

		expect(mockedUploadPhoto).not.toHaveBeenCalled();
	});

	it('returns 400 for an empty file', async () => {
		const file = new File([], 'photo.jpg', { type: 'image/jpeg' });

		const response = await POST(createAuthenticatedEvent(await createMultipartRequest(file)));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'An image file is required' });
		expect(mockedUploadPhoto).not.toHaveBeenCalled();
	});

	describe('file signature', () => {
		const UNSUPPORTED = 'Only JPEG, PNG or WebP images are allowed';

		it('returns 415 for a non-image file', async () => {
			const file = new File(['hello'], 'document.txt', {
				type: 'text/plain'
			});

			const request = await createMultipartRequest(file);
			const event = createAuthenticatedEvent(request);

			const response = await POST(event);

			expect(response.status).toBe(415);
			expect(await response.json()).toEqual({
				error: UNSUPPORTED
			});

			expect(mockedUploadPhoto).not.toHaveBeenCalled();
		});

		it('returns 415 for SVG declared as image/svg+xml', async () => {
			const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], 'photo.svg', {
				type: 'image/svg+xml'
			});

			const response = await POST(createAuthenticatedEvent(await createMultipartRequest(file)));

			expect(response.status).toBe(415);
			expect(await response.json()).toEqual({ error: UNSUPPORTED });
			expect(mockedUploadPhoto).not.toHaveBeenCalled();
		});

		it.each([
			['SVG', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
			['HTML', '<!DOCTYPE html><html><script>alert(1)</script></html>'],
			['a Windows executable', new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0, 0, 0, 0, 0, 0, 0])]
		])('returns 415 for %s content disguised as image/png', async (_label, content) => {
			const file = new File([content], 'photo.png', { type: 'image/png' });

			const response = await POST(createAuthenticatedEvent(await createMultipartRequest(file)));

			expect(response.status).toBe(415);
			expect(await response.json()).toEqual({ error: UNSUPPORTED });
			expect(mockedUploadPhoto).not.toHaveBeenCalled();
		});
	});

	it('returns 503 when R2 storage is not configured', async () => {
		const file = imageFile(JPEG_HEADER, 'photo.jpg', 'image/jpeg');

		const request = await createMultipartRequest(file);

		const event = createAuthenticatedEvent(request, {
			mediaBucket: null
		});

		const response = await POST(event);

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({
			error: 'Image storage is not configured'
		});

		expect(mockedUploadPhoto).not.toHaveBeenCalled();
	});

	it('returns 500 when the upload fails', async () => {
		mockedUploadPhoto.mockRejectedValue(new Error('R2 unavailable'));

		const file = imageFile(JPEG_HEADER, 'photo.jpg', 'image/jpeg');

		const request = await createMultipartRequest(file);
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: 'Failed to store image'
		});
	});

	it('uploads an image and returns the image key', async () => {
		const file = imageFile(JPEG_HEADER, 'profile.jpg', 'image/jpeg');

		const request = await createMultipartRequest(file);
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({
			imageKey: 'images/test-image-key'
		});

		expect(mockedUploadPhoto).toHaveBeenCalledTimes(1);
		expect(mockedUploadPhoto).toHaveBeenCalledWith({}, expect.any(File), 'image/jpeg');
	});

	it.each([
		['PNG', PNG_HEADER, 'image/png'],
		['WebP', WEBP_HEADER, 'image/webp']
	])(
		'stores a %s with the detected type, not the declared one',
		async (_label, signature, expected) => {
			// Declared as JPEG with a .jpg name; the bytes say otherwise.
			const file = imageFile(signature, 'photo.jpg', 'image/jpeg');

			const response = await POST(createAuthenticatedEvent(await createMultipartRequest(file)));

			expect(response.status).toBe(201);
			expect(mockedUploadPhoto).toHaveBeenCalledWith({}, expect.any(File), expected);
		}
	);
});
