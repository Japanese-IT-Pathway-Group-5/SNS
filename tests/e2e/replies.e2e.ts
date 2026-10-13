import { expect, test } from '@playwright/test';

test('creates and deletes a reply from a feed card without opening post detail', async ({
	page
}) => {
	const email = `e2e-${Date.now()}@example.com`;
	const password = 'E2eTest123!';
	const replyText = `E2E reply ${Date.now()}`;

	await page.goto('/login?redirectTo=/');

	await page.getByRole('button', { name: 'Create an account' }).click();
	await page.locator('#auth-name').fill('E2E Test User');
	await page.locator('#auth-email').fill(email);
	await page.locator('#auth-password').fill(password);
	await page.locator('#auth-confirm-password').fill(password);
	await page.getByRole('button', { name: 'Create account', exact: true }).click();

	await expect(page).toHaveURL('/');

	const postCard = page
		.locator('article')
		.filter({ has: page.getByRole('button', { name: /\d+ repl(y|ies)/i }) })
		.first();
	await postCard.getByRole('button', { name: /\d+ repl(y|ies)/i }).click();
	await postCard.getByRole('button', { name: 'Write a reply' }).click();
	const replyInput = postCard.getByRole('textbox', { name: 'Write a reply' });
	const submitReply = postCard.getByRole('button', { name: 'Post reply', exact: true });

	await replyInput.fill('😀'.repeat(500));
	await expect(submitReply).toBeEnabled();
	await replyInput.fill('😀'.repeat(501));
	await expect(submitReply).toBeDisabled();
	await replyInput.fill(replyText);
	await submitReply.click();

	await expect(postCard.getByText(replyText, { exact: true })).toBeVisible();

	const reply = postCard.locator('article').filter({ hasText: replyText });
	await expect(reply).toBeVisible();
	await reply.getByRole('button', { name: 'Delete reply' }).click();

	await expect(postCard.getByText(replyText, { exact: true })).toHaveCount(0);

	await page.goto('/post/seed-post-01');
	const repliesSection = page.getByRole('region', { name: /Replies/ });
	await expect(page.getByRole('heading', { name: 'Replies (2)' })).toBeVisible();
	const detailReplies = repliesSection.locator('article');
	await expect(detailReplies).toHaveCount(2);
	await expect(detailReplies.nth(0)).toContainText('It was :)');
	await expect(detailReplies.nth(1)).toContainText('Sounds delicious!');

	const hiddenRepliesResponse = await page.request.get('/api/replies?postId=seed-post-07');
	expect(hiddenRepliesResponse.status()).toBe(200);
	await expect(hiddenRepliesResponse).toBeOK();
	expect(await hiddenRepliesResponse.json()).toEqual({ items: [], nextCursor: null });

	const hiddenPostResponse = await page.goto('/post/seed-post-07');
	expect(hiddenPostResponse?.status()).toBe(404);
});
