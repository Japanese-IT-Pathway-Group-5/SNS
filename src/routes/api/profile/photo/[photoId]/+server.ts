import { error, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { profilePhotoKey } from '$lib/server/profile/update';
import { SUPPORTED_PHOTO_TYPES } from '$lib/server/storage/photo-upload';

export const GET: RequestHandler = async ({ params, platform }) => {
	if (!params.photoId || !/^[0-9a-f-]{36}$/.test(params.photoId)) error(404, 'Photo not found');
	if (!platform?.env?.DB || !platform.env.MEDIA_BUCKET) error(503, 'Photo unavailable');
	const image = `/api/profile/photo/${params.photoId}`;
	const [profile] = await getDb(platform.env.DB)
		.select({ image: user.image })
		.from(user)
		.where(eq(user.image, image))
		.limit(1);
	const key = profilePhotoKey(profile?.image);
	if (!key) error(404, 'Photo not found');
	const object = await platform.env.MEDIA_BUCKET.get(key);
	const type = object?.httpMetadata?.contentType;
	if (!object || !type || !SUPPORTED_PHOTO_TYPES.some((allowed) => allowed === type))
		error(404, 'Photo not found');
	return new Response(object.body, {
		headers: {
			'Content-Type': type,
			'Content-Length': String(object.size),
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
