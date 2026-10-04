import { expect, test } from '@playwright/test';

test('opens a post, submits a reply, and deletes the reply', async ({ page }) => {
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

	const replyLinks = page.getByRole('link', { name: 'Reply', exact: true });
	await expect(replyLinks.first()).toBeVisible();
	await replyLinks.first().click();

	await expect(page).toHaveURL(/\/post\/[^/]+$/);
	await expect(page.getByRole('heading', { name: /Replies \(\d+\)/ })).toBeVisible();
	await expect(page.locator('#reply-body')).toBeVisible();

	await page.locator('#reply-body').fill(replyText);
	await page.getByRole('button', { name: 'Reply', exact: true }).click();

	await expect(page.getByText(replyText, { exact: true })).toBeVisible();

	const reply = page.locator('article').filter({ hasText: replyText });

	await expect(reply).toBeVisible();
	await reply.getByRole('button', { name: 'Delete reply' }).click();

	await expect(page.getByText(replyText, { exact: true })).toHaveCount(0);
});
