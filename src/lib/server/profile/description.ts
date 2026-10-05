import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

export async function getOwnDescription(d1: D1Database, userId: string) {
	if (!userId) throw new Error('Authentication required');
	const [profile] = await getDb(d1)
		.select({ description: user.description })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	if (!profile) throw new Error('Profile not found');
	return profile.description ?? '';
}
