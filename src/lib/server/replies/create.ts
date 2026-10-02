import { and, eq, isNull } from 'drizzle-orm';
import { requireMembership } from '$lib/server/auth/authorization';
import { getDb } from '$lib/server/db';
import { post, reply } from '$lib/server/db/schema';
import { replyInputSchema, type ReplyInput } from '$lib/validation/posts';

export class ReplyValidationError extends Error {}
export class ReplyNotFoundError extends Error {}

export async function createReply({
        d1,
        userId,
        postId,
        input
}: {
        d1: D1Database;
        userId: string;
        postId: string;
        input: ReplyInput;
}) {
        await requireMembership(d1, userId);

        const parsed = replyInputSchema.safeParse(input);

        if (!parsed.success) {
                throw new ReplyValidationError(parsed.error.issues[0]?.message ?? 'Invalid reply');
        }

        const db = getDb(d1);

        const parent = await db
                .select({
                        id: post.id,
                        hiddenAt: post.hiddenAt
                })
                .from(post)
                .where(and(eq(post.id, postId), isNull(post.hiddenAt)))
                .limit(1);

        if (!parent[0]) {
                throw new ReplyNotFoundError('Post not found');
        }

        const id = crypto.randomUUID();

        await db.insert(reply).values({
                id,
                postId,
                authorId: userId,
                body: parsed.data.body
        });

        return {
                id,
                postId,
                authorId: userId,
                body: parsed.data.body
        };
}
