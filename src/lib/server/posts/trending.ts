import { sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';

export interface TrendingJournal {
	id: string;
	authorId: string;
	authorName: string;
	authorImage: string | null;
	body: string;
}

/** Recent posting activity, one latest visible entry per author; no popularity counts leave the server. */
export async function listTrendingJournals({
	d1,
	now = new Date()
}: {
	d1: D1Database;
	now?: Date;
}): Promise<TrendingJournal[]> {
	const since = now.getTime() - 7 * 24 * 60 * 60 * 1000;
	const db = getDb(d1);
	return db.all<TrendingJournal>(sql`
		SELECT id, authorId, authorName, authorImage, body FROM (
			SELECT p.id, p.author_id AS authorId, u.name AS authorName, u.image AS authorImage, p.body,
				p.created_at AS createdAt,
				COUNT(*) OVER (PARTITION BY p.author_id) AS activity,
				ROW_NUMBER() OVER (PARTITION BY p.author_id ORDER BY p.created_at DESC, p.id DESC) AS position
			FROM post p INNER JOIN user u ON u.id = p.author_id
			WHERE p.hidden_at IS NULL AND p.created_at >= ${since}
		) WHERE position = 1
		ORDER BY activity DESC, createdAt DESC, id DESC
		LIMIT 5
	`);
}
