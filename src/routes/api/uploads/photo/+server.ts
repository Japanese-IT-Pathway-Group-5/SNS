import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { media } from '$lib/server/db/schema';
import { rateLimitUpload } from '$lib/server/security/rate-limit';
import { requireMembership } from '$lib/server/auth/authorization';
import { detectImageTypeFromFile } from '$lib/server/storage/image-signature';
import { uploadPhoto } from '$lib/server/storage/photo-upload';
import { deleteObject, type R2Storage } from '$lib/server/storage/r2';
import { checkUploadContentLength, validatePhotoUpload } from '$lib/validation/photo-upload';

const TOO_LARGE = 'Image is too large';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const env = platform?.env as {
		DB?: D1Database;
		MEDIA_BUCKET?: R2Storage;
	};

	if (!env.MEDIA_BUCKET || !env.DB) {
		return json({ error: 'Image storage is not configured' }, { status: 503 });
	}

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await requireMembership(env.DB, locals.user.id);
	} catch {
		return json({ error: 'Membership required' }, { status: 403 });
	}

	const rateLimitResult = await rateLimitUpload(platform?.env?.UPLOAD_RATE_LIMITER, locals.user.id);

	if (!rateLimitResult.allowed) {
		return json({ error: 'Too many upload requests' }, { status: rateLimitResult.status });
	}

	const contentType = request.headers.get('content-type') ?? '';

	if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
		return json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
	}

	// Reject by declared size before the body is buffered by formData().
	const contentLength = checkUploadContentLength(request.headers.get('content-length'));

	if (contentLength === 'missing') {
		return json({ error: 'Content-Length header is required' }, { status: 411 });
	}

	if (contentLength === 'invalid') {
		return json({ error: 'Invalid Content-Length header' }, { status: 400 });
	}

	if (contentLength === 'too_large') {
		return json({ error: TOO_LARGE }, { status: 413 });
	}

	let formData: FormData;

	try {
		formData = await request.formData();
	} catch {
		return json({ error: 'Invalid multipart form data' }, { status: 400 });
	}

	const upload = validatePhotoUpload(formData);

	if (!upload.success) {
		return upload.error === 'too_large'
			? json({ error: TOO_LARGE }, { status: 413 })
			: json({ error: 'An image file is required' }, { status: 400 });
	}

	// Trust the file's bytes, never its declared MIME type or filename.
	const imageType = await detectImageTypeFromFile(upload.file);

	if (!imageType) {
		return json({ error: 'Only JPEG, PNG or WebP images are allowed' }, { status: 415 });
	}

	let uploaded: Awaited<ReturnType<typeof uploadPhoto>> | undefined;

	try {
		uploaded = await uploadPhoto(env.MEDIA_BUCKET, upload.file, imageType);

		const db = getDb(env.DB);
		const mediaId = crypto.randomUUID();

		await db.insert(media).values({
			id: mediaId,
			ownerId: locals.user.id,
			objectKey: uploaded.objectKey,
			contentType: uploaded.contentType,
			byteSize: uploaded.byteSize,
			status: 'pending'
		});

		return json({ mediaId }, { status: 201 });
	} catch (error) {
		if (uploaded) {
			try {
				await deleteObject(env.MEDIA_BUCKET, uploaded.objectKey);
			} catch (cleanupError) {
				console.error('Failed to clean up uploaded image:', cleanupError);
			}
		}

		console.error('Failed to store image:', error);

		return json({ error: 'Failed to store image' }, { status: 500 });
	}
};
