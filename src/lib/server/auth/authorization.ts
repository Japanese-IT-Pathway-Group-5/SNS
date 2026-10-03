import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { membership } from '$lib/server/db/schema';

export type MembershipRole = 'member' | 'moderator';

export async function getMembership(d1: D1Database, userId: string) {
	const db = getDb(d1);

	const rows = await db
		.select({
			id: membership.id,
			userId: membership.userId,
			role: membership.role
		})
		.from(membership)
		.where(eq(membership.userId, userId))
		.limit(1);

	return rows[0] ?? null;
}

export async function requireMembership(
	d1: D1Database,
	userId: string
): Promise<{
	id: string;
	userId: string;
	role: MembershipRole;
}> {
	const result = await getMembership(d1, userId);

	if (!result) {
		throw new Error('Membership required');
	}

	return result as {
		id: string;
		userId: string;
		role: MembershipRole;
	};
}

export async function requireModerator(
	d1: D1Database,
	userId: string
): Promise<{
	id: string;
	userId: string;
	role: 'moderator';
}> {
	const result = await getMembership(d1, userId);

	if (!result || result.role !== 'moderator') {
		throw new Error('Moderator permission required');
	}

	return {
		id: result.id,
		userId: result.userId,
		role: 'moderator'
	};
}
