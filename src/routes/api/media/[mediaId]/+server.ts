import { json, type RequestHandler } from '@sveltejs/kit';
import { getMedia, MediaNotFoundError } from '$lib/server/media/get';
import { requireMembership } from '$lib/server/auth/authorization';
import type { R2Storage } from '$lib/server/storage/r2';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const env = platform?.env as {
		DB?: D1Database;
		MEDIA_BUCKET?: R2Storage;
	};

	if (!env.DB || !env.MEDIA_BUCKET) {
		return json({ error: 'Storage is not configured' }, { status: 503 });
	}

	const mediaId = params.mediaId?.trim();

	if (!mediaId) {
		return json({ error: 'mediaId is required' }, { status: 400 });
	}

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await requireMembership(env.DB, locals.user.id);
	} catch {
		return json({ error: 'Membership required' }, { status: 403 });
	}

	try {
		const result = await getMedia({
			d1: env.DB,
			mediaId,
			bucket: env.MEDIA_BUCKET
		});

		return new Response(result.object.body, {
			status: 200,
			headers: {
				'Content-Type': result.contentType,
				'Content-Length': String(result.byteSize),
				'Cache-Control': 'public, no-store',
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch (error) {
		if (error instanceof MediaNotFoundError) {
			return json({ error: 'Media not found' }, { status: 404 });
		}

		console.error('Failed to get media:', error);

		return json({ error: 'Failed to get media' }, { status: 500 });
	}
};
