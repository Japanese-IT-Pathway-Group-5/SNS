import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { media, post } from '$lib/server/db/schema';
import { getObject, type R2Storage } from '$lib/server/storage/r2';

export class MediaNotFoundError extends Error {}

export async function getMedia({
	d1,
	mediaId,
	bucket
}: {
	d1: D1Database;
	mediaId: string;
	bucket: R2Storage;
}) {
	const db = getDb(d1);

	const rows = await db
		.select({
			objectKey: media.objectKey,
			contentType: media.contentType,
			byteSize: media.byteSize
		})
		.from(media)
		.innerJoin(post, eq(post.mediaId, media.id))
		.where(and(eq(media.id, mediaId), eq(media.status, 'ready'), isNull(post.hiddenAt)))
		.limit(1);

	const row = rows[0];

	if (!row) {
		throw new MediaNotFoundError('Media not found');
	}

	const object = await getObject(bucket, row.objectKey);

	if (!object) {
		throw new MediaNotFoundError('Media not found');
	}

	return {
		object,
		contentType: row.contentType,
		byteSize: row.byteSize
	};
}
