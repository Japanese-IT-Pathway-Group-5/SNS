import { relations, sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
	image: text('image'),
	description: text('description'),
	banner: text('banner'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull()
});

export const membership = sqliteTable(
	'membership',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role', { enum: ['member', 'moderator'] })
			.notNull()
			.default('member'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [uniqueIndex('membership_userId_unique').on(table.userId)]
);

export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_userId_idx').on(table.userId)]
);

export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: integer('access_token_expires_at', {
			mode: 'timestamp_ms'
		}),
		refreshTokenExpiresAt: integer('refresh_token_expires_at', {
			mode: 'timestamp_ms'
		}),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = sqliteTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const media = sqliteTable(
	'media',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		objectKey: text('object_key').notNull().unique(),
		contentType: text('content_type').notNull(),
		byteSize: integer('byte_size').notNull(),
		status: text('status', { enum: ['pending', 'ready', 'cleanup'] })
			.notNull()
			.default('pending'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index('media_ownerId_status_idx').on(table.ownerId, table.status),
		index('media_objectKey_idx').on(table.objectKey)
	]
);

export const post = sqliteTable(
	'post',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// Client-generated ID so a retried submission does not create a duplicate post.
		submissionId: text('submission_id').notNull(),
		body: text('body').notNull().default(''),
		// References server-owned media metadata; null for text-only posts.
		mediaId: text('media_id').references(() => media.id, { onDelete: 'set null' }),
		hiddenAt: integer('hidden_at', { mode: 'timestamp_ms' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex('post_authorId_submissionId_unique').on(table.authorId, table.submissionId),
		index('post_createdAt_id_idx').on(table.createdAt, table.id),
		index('post_authorId_createdAt_id_idx').on(table.authorId, table.createdAt, table.id),
		index('post_mediaId_idx').on(table.mediaId)
	]
);

export const reply = sqliteTable(
	'reply',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		postId: text('post_id')
			.notNull()
			.references(() => post.id, { onDelete: 'cascade' }),
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		body: text('body').notNull(),
		hiddenAt: integer('hidden_at', { mode: 'timestamp_ms' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index('reply_postId_createdAt_id_idx').on(table.postId, table.createdAt, table.id),
		index('reply_authorId_idx').on(table.authorId)
	]
);

// Audit log of moderator actions; exactly one of postId / replyId is set.
export const moderationEvent = sqliteTable(
	'moderation_event',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		moderatorId: text('moderator_id').references(() => user.id, { onDelete: 'set null' }),
		postId: text('post_id').references(() => post.id, { onDelete: 'cascade' }),
		replyId: text('reply_id').references(() => reply.id, { onDelete: 'cascade' }),
		action: text('action', { enum: ['hide', 'unhide'] }).notNull(),
		reason: text('reason').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull()
	},
	(table) => [
		index('moderationEvent_postId_idx').on(table.postId),
		index('moderationEvent_replyId_idx').on(table.replyId)
	]
);

export const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	accounts: many(account),
	posts: many(post),
	replies: many(reply),
	media: many(media),
	membership: one(membership, {
		fields: [user.id],
		references: [membership.userId]
	})
}));
export const mediaRelations = relations(media, ({ one }) => ({
	owner: one(user, {
		fields: [media.ownerId],
		references: [user.id]
	})
}));

export const membershipRelations = relations(membership, ({ one }) => ({
	user: one(user, {
		fields: [membership.userId],
		references: [user.id]
	})
}));

export const postRelations = relations(post, ({ one, many }) => ({
	author: one(user, {
		fields: [post.authorId],
		references: [user.id]
	}),
	replies: many(reply),
	media: one(media, {
		fields: [post.mediaId],
		references: [media.id]
	}),
	moderationEvents: many(moderationEvent)
}));

export const replyRelations = relations(reply, ({ one, many }) => ({
	post: one(post, {
		fields: [reply.postId],
		references: [post.id]
	}),
	author: one(user, {
		fields: [reply.authorId],
		references: [user.id]
	}),
	moderationEvents: many(moderationEvent)
}));

export const moderationEventRelations = relations(moderationEvent, ({ one }) => ({
	moderator: one(user, {
		fields: [moderationEvent.moderatorId],
		references: [user.id]
	}),
	post: one(post, {
		fields: [moderationEvent.postId],
		references: [post.id]
	}),
	reply: one(reply, {
		fields: [moderationEvent.replyId],
		references: [reply.id]
	})
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));
