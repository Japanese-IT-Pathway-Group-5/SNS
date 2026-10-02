PRAGMA foreign_keys=OFF;

CREATE TABLE `post_new` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`submission_id` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`media_id` text,
	`hidden_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);

INSERT INTO `post_new` (
	`id`,
	`author_id`,
	`submission_id`,
	`body`,
	`media_id`,
	`hidden_at`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`author_id`,
	`submission_id`,
	`body`,
	NULL,
	`hidden_at`,
	`created_at`,
	`updated_at`
FROM `post`;

DROP TABLE `post`;

ALTER TABLE `post_new` RENAME TO `post`;

CREATE UNIQUE INDEX `post_authorId_submissionId_unique`
	ON `post` (`author_id`, `submission_id`);

CREATE INDEX `post_createdAt_id_idx`
	ON `post` (`created_at`, `id`);

CREATE INDEX `post_authorId_createdAt_id_idx`
	ON `post` (`author_id`, `created_at`, `id`);

CREATE INDEX `post_mediaId_idx`
	ON `post` (`media_id`);

PRAGMA foreign_keys=ON;
