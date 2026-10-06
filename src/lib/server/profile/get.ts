import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

/** Deliberately select public fields only, never account or session records. */
export async function getPublicProfile(d1: D1Database, userId: string) {
	if (!userId || userId.length > 256) return null;
	const [profile] = await getDb(d1)
		.select({
			id: user.id,
			name: user.name,
			image: user.image,
			description: user.description,
			banner: user.banner
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	return profile
		? { ...profile, description: profile.description ?? '', banner: profile.banner ?? '' }
		: null;
}
