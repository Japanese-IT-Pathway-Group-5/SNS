import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server';
import { getDb } from '$lib/server/db';
import { rateLimitUpload } from '$lib/server/security/rate-limit';
import { uploadPhoto } from '$lib/server/storage/photo-upload';

vi.mock('$lib/server/security/rate-limit', () => ({
	rateLimitUpload: vi.fn()
}));

vi.mock('$lib/server/storage/photo-upload', () => ({
	uploadPhoto: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

const mockedRateLimitUpload = vi.mocked(rateLimitUpload);
const mockedUploadPhoto = vi.mocked(uploadPhoto);
const mockedGetDb = vi.mocked(getDb);

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
				DB: {},
				MEDIA_BUCKET: options.mediaBucket === undefined ? {} : options.mediaBucket
			}
		}
	} as unknown as Parameters<typeof POST>[0];
}

function createMultipartRequest(file?: File): Request {
	const formData = new FormData();

	if (file) {
		formData.append('file', file);
	}

	return new Request('http://localhost/api/uploads/photo', {
		method: 'POST',
		body: formData
	});
}

describe('POST /api/uploads/photo', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockedRateLimitUpload.mockResolvedValue({
			allowed: true
		});

		mockedUploadPhoto.mockResolvedValue({
			objectKey: 'images/test-image-key',
			contentType: 'image/jpeg',
			byteSize: 123,
			width: 1,
			height: 1
		});

		mockedGetDb.mockReturnValue({
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockResolvedValue(undefined)
			})
		} as never);
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

	it('returns 400 when the file field is missing', async () => {
		const request = createMultipartRequest();
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'An image file is required'
		});

		expect(mockedUploadPhoto).not.toHaveBeenCalled();
	});

	it('returns 400 for a non-image file', async () => {
		const file = new File(['hello'], 'document.txt', {
			type: 'text/plain'
		});

		const request = createMultipartRequest(file);
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: 'Only image files are allowed'
		});

		expect(mockedUploadPhoto).not.toHaveBeenCalled();
	});

	it('returns 503 when R2 storage is not configured', async () => {
		const file = new File(['fake image'], 'photo.jpg', {
			type: 'image/jpeg'
		});

		const request = createMultipartRequest(file);

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

		const file = new File(['fake image'], 'photo.jpg', {
			type: 'image/jpeg'
		});

		const request = createMultipartRequest(file);
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: 'Failed to store image'
		});
	});

	it('uploads an image, stores media metadata, and returns the media id', async () => {
		const file = new File(['fake image'], 'profile.jpg', {
			type: 'image/jpeg'
		});

		const request = createMultipartRequest(file);
		const event = createAuthenticatedEvent(request);

		const response = await POST(event);

		expect(response.status).toBe(201);

		const body = await response.json();

		expect(body).toEqual({
			mediaId: expect.any(String)
		});

		expect(mockedUploadPhoto).toHaveBeenCalledTimes(1);
		expect(mockedUploadPhoto).toHaveBeenCalledWith({}, expect.any(File));

		expect(mockedGetDb).toHaveBeenCalledWith({});
	});
});
