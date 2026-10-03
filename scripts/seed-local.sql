-- Local development seed data. Run with: pnpm db:seed:local
-- Never run against staging or production. All IDs start with "seed-" so the
-- script can be re-run safely: it removes its own rows before inserting.
-- Timestamps are UTC milliseconds starting 2026-09-01T00:00:00Z (1788220800000).

DELETE FROM moderation_event WHERE id LIKE 'seed-%';
DELETE FROM reply WHERE id LIKE 'seed-%';
DELETE FROM post WHERE id LIKE 'seed-%';
DELETE FROM membership WHERE id LIKE 'seed-%';
DELETE FROM user WHERE id LIKE 'seed-%';

INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES
	('seed-user-aiko', 'Aiko (seed)', 'aiko@example.com', 1, 1788220800000, 1788220800000),
	('seed-user-ben', 'Ben (seed)', 'ben@example.com', 1, 1788220800000, 1788220800000),
	('seed-user-mod', 'Moderator (seed)', 'moderator@example.com', 1, 1788220800000, 1788220800000);

INSERT INTO membership (id, user_id, role, created_at, updated_at) VALUES
	('seed-membership-aiko', 'seed-user-aiko', 'member', 1788220800000, 1788220800000),
	('seed-membership-ben', 'seed-user-ben', 'member', 1788220800000, 1788220800000),
	('seed-membership-mod', 'seed-user-mod', 'moderator', 1788220800000, 1788220800000);

-- Hand-written posts, newest first. seed-post-05 and seed-post-06 share a
-- timestamp so feed ordering must fall back to id as the tie-breaker.
INSERT INTO post (id, author_id, submission_id, body, media_id, hidden_at, created_at, updated_at) VALUES
	('seed-post-01', 'seed-user-aiko', 'seed-sub-01', 'Made miso soup for breakfast. Too much tofu, no regrets.', NULL, NULL, 1788400000000, 1788400000000),
	('seed-post-02', 'seed-user-ben', 'seed-sub-02', 'Rain all day.
Finished the book I started last month.', NULL, NULL, 1788390000000, 1788390000000),
	('seed-post-03', 'seed-user-aiko', 'seed-sub-03', 'Walked to the station instead of taking the bus.', NULL, NULL, 1788380000000, 1788380000000),
	('seed-post-04', 'seed-user-ben', 'seed-sub-04', '<script>alert("seed")</script> this text must render as plain text.', NULL, NULL, 1788370000000, 1788370000000),
	('seed-post-05', 'seed-user-aiko', 'seed-sub-05', 'Same-time post A.', NULL, NULL, 1788360000000, 1788360000000),
	('seed-post-06', 'seed-user-ben', 'seed-sub-06', 'Same-time post B.', NULL, NULL, 1788360000000, 1788360000000),
	('seed-post-07', 'seed-user-ben', 'seed-sub-07', 'This post was hidden by a moderator.', NULL, 1788355000000, 1788350000000, 1788355000000);

-- 20 older filler posts so the feed has more than one 20-post page.
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 20)
INSERT INTO post (id, author_id, submission_id, body, media_id, hidden_at, created_at, updated_at)
SELECT
	printf('seed-post-filler-%02d', i),
	CASE WHEN i % 2 = 0 THEN 'seed-user-aiko' ELSE 'seed-user-ben' END,
	printf('seed-sub-filler-%02d', i),
	printf('Everyday note #%d.', i),
	NULL,
	NULL,
	1788300000000 - i * 3600000,
	1788300000000 - i * 3600000
FROM n;

INSERT INTO reply (id, post_id, author_id, body, hidden_at, created_at, updated_at) VALUES
	('seed-reply-01', 'seed-post-01', 'seed-user-ben', 'Sounds delicious!', NULL, 1788401000000, 1788401000000),
	('seed-reply-02', 'seed-post-01', 'seed-user-aiko', 'It was :)', NULL, 1788402000000, 1788402000000),
	('seed-reply-03', 'seed-post-02', 'seed-user-aiko', 'Which book?', NULL, 1788391000000, 1788391000000),
	('seed-reply-04', 'seed-post-03', 'seed-user-ben', 'Hidden reply example.', 1788382000000, 1788381000000, 1788382000000);

INSERT INTO moderation_event (id, moderator_id, post_id, reply_id, action, reason, created_at) VALUES
	('seed-mod-01', 'seed-user-mod', 'seed-post-07', NULL, 'hide', 'Seed example: off-topic content.', 1788355000000),
	('seed-mod-02', 'seed-user-mod', NULL, 'seed-reply-04', 'hide', 'Seed example: rude reply.', 1788382000000);
