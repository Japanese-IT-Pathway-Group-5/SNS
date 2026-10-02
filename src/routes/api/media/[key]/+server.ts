import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { R2Storage } from '$lib/server/storage/r2';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	const env = platform?.env as { MEDIA_BUCKET?: R2Storage } | undefined;

	// Require membership when serving private images
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!env?.MEDIA_BUCKET) {
		throw error(503, 'Image storage is not configured');
	}

	const key = params.key;
	if (!key || typeof key !== 'string') {
		throw error(400, 'Invalid image key');
	}

	const object = await env.MEDIA_BUCKET.get(key);

	if (!object) {
		throw error(404, 'Image not found');
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	headers.set('X-Content-Type-Options', 'nosniff'); // Security rule from PROJECT_PLAN.md

	// Send back the object's body as a response stream
	return new Response(object.body, {
		headers
	});
};
