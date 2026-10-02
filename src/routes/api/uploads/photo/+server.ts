import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { media } from '$lib/server/db/schema';
import { rateLimitUpload } from '$lib/server/security/rate-limit';
import { uploadPhoto } from '$lib/server/storage/photo-upload';
import { deleteObject, type R2Storage } from '$lib/server/storage/r2';
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const env = platform?.env as {
		MEDIA_BUCKET?: R2Storage;
	};

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const rateLimitResult = await rateLimitUpload(platform?.env?.UPLOAD_RATE_LIMITER, locals.user.id);

	if (!rateLimitResult.allowed) {
		return json({ error: 'Too many upload requests' }, { status: rateLimitResult.status });
	}

	const contentType = request.headers.get('content-type') ?? '';

	if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
		return json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
	}

	let formData: FormData;

	try {
		formData = await request.formData();
	} catch {
		return json({ error: 'Invalid multipart form data' }, { status: 400 });
	}

	const file = formData.get('file');

	if (!(file instanceof File)) {
		return json({ error: 'An image file is required' }, { status: 400 });
	}

	if (!file.type.startsWith('image/')) {
		return json({ error: 'Only image files are allowed' }, { status: 400 });
	}

	if (!env?.MEDIA_BUCKET) {
		return json({ error: 'Image storage is not configured' }, { status: 503 });
	}
	try {
		const mediaId = await uploadPhoto(env.MEDIA_BUCKET, file);

		return json({ mediaId }, { status: 201 });
	} catch (error) {
		console.error('Failed to upload image to R2:', error);

		return json({ error: 'Failed to store image' }, { status: 500 });
	}
};
