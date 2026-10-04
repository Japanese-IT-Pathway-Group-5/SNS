import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/components');
	await expect(page.locator('#post-body')).toBeVisible();
	await expect
		.poll(() => page.locator('#post-body').evaluate((el) => el.style.height))
		.toMatch(/px$/);
});

test('expands and counts Japanese and emoji without cutting off input', async ({ page }) => {
	const field = page.locator('#post-body');
	const composer = page.getByRole('region', { name: 'Share a moment' });
	const initialHeight = await field.evaluate((el) => el.getBoundingClientRect().height);
	await field.fill('今日のこと\n'.repeat(30));
	await expect
		.poll(() => field.evaluate((el) => el.getBoundingClientRect().height))
		.toBeGreaterThan(initialHeight);
	await field.fill('🌱'.repeat(2000));
	await expect(composer.getByText('2000/2000', { exact: true })).toBeVisible();
	await expect(composer.getByRole('button', { name: 'Post', exact: true })).toBeEnabled();
	await field.fill('🌱'.repeat(2001));
	await expect(field).toHaveValue('🌱'.repeat(2001));
	await expect(field).toHaveAttribute('aria-invalid', 'true');
	await expect(composer.getByRole('alert')).toContainText('2000 characters or fewer');
	await expect(composer.getByRole('button', { name: 'Post', exact: true })).toBeDisabled();
	await field.fill('今日🌱');
	await field.press('End');
	await field.press('Enter');
	await expect(field).toHaveValue('今日🌱\n');
	await expect(composer.getByText('4/2000', { exact: true })).toBeVisible();
});

test('locks while pending, preserves a failed draft and retries the same submission', async ({
	page
}) => {
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	const submissions: string[] = [];
	await page.route('**/*?/createPost', async (route) => {
		submissions.push(route.request().postData() ?? '');
		await pending;
		await route.fulfill({
			status: 400,
			contentType: 'application/json',
			body: JSON.stringify({
				type: 'failure',
				status: 400,
				data: '[{"message":1},"Please try again."]'
			})
		});
	});
	const field = page.locator('#post-body');
	await field.fill('A small everyday moment.');
	await page.getByRole('button', { name: 'Post', exact: true }).click();
	await expect(field).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Posting...' })).toBeDisabled();
	await page
		.locator('#post-body')
		.evaluate((el) => (el.closest('form') as HTMLFormElement).requestSubmit());
	release();
	await expect(page.getByRole('alert').filter({ hasText: 'Please try again.' })).toBeVisible();
	await expect(field).toHaveValue('A small everyday moment.');
	await page.getByRole('button', { name: 'Post', exact: true }).click();
	await expect(field).toBeEnabled();
	expect(submissions).toHaveLength(2);
	expect(submissions[0]).toBe(submissions[1]);
});

test('keeps text on a network failure and clears only after confirmed success', async ({
	page
}) => {
	const field = page.locator('#post-body');
	await field.fill('Keep this entry.');
	await page.route('**/*?/createPost', (route) => route.abort());
	await page.getByRole('button', { name: 'Post', exact: true }).click();
	await expect(page.getByRole('alert').filter({ hasText: 'could not be posted' })).toBeVisible();
	await expect(field).toHaveValue('Keep this entry.');
	await page.unroute('**/*?/createPost');
	await page.route('**/*?/createPost', (route) =>
		route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({
				type: 'success',
				status: 200,
				data: '[{"success":1},true]'
			})
		})
	);
	await page.getByRole('button', { name: 'Post', exact: true }).click();
	await expect(page).toHaveURL('/');
	expect(
		await page.evaluate(() => localStorage.getItem('composer_draft_showcase-composer'))
	).toBeNull();
});

test('shows the actual signed-out action error without losing text', async ({ page }) => {
	await page.locator('#post-body').fill('Keep my signed-out draft.');
	await page.getByRole('button', { name: 'Post', exact: true }).click();
	await expect(page.getByRole('alert').filter({ hasText: 'Please sign in again' })).toBeVisible();
	await expect(page.locator('#post-body')).toHaveValue('Keep my signed-out draft.');
});

test('retains text and the selected photo after an upload failure', async ({ page }) => {
	await page.route('**/api/uploads/photo', (route) => route.fulfill({ status: 503 }));
	await page.locator('#post-body').fill('My photo entry.');
	await page
		.getByRole('region', { name: 'Share a moment' })
		.locator('input[type="file"]')
		.setInputFiles({
			name: 'photo.png',
			mimeType: 'image/png',
			buffer: Buffer.from(
				'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
				'base64'
			)
		});
	await expect(page.getByRole('button', { name: 'Remove image' }).last()).toBeVisible();
	await page.getByRole('button', { name: 'Post', exact: true }).click();
	await expect(page.getByRole('alert').filter({ hasText: 'could not be uploaded' })).toBeVisible();
	await expect(page.locator('#post-body')).toHaveValue('My photo entry.');
	await expect(page.getByRole('button', { name: 'Remove image' }).last()).toBeEnabled();
});

test('allows writing without device storage and fits mobile widths', async ({ page }) => {
	await page.addInitScript(() => {
		Storage.prototype.getItem = () => {
			throw new Error('Storage blocked');
		};
		Storage.prototype.setItem = () => {
			throw new Error('Storage blocked');
		};
		Storage.prototype.removeItem = () => {
			throw new Error('Storage blocked');
		};
	});
	await page.reload();
	await expect
		.poll(() => page.locator('#post-body').evaluate((el) => el.style.height))
		.toMatch(/px$/);
	await page.locator('#post-body').fill('書いています🌱');
	await expect(page.getByRole('button', { name: 'Post', exact: true })).toBeEnabled();
	await expect(page.getByText('Draft saved on this device', { exact: true })).toHaveCount(0);
	for (const width of [320, 375, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		expect(
			await page.locator('#post-body').evaluate((el) => {
				const section = el.closest('section')!;
				return section.scrollWidth <= section.clientWidth;
			})
		).toBe(true);
		if (width === 375 || width === 1280) {
			await page
				.getByRole('region', { name: 'Share a moment' })
				.screenshot({ path: `test-results/composer-${width}.png` });
		}
	}
	await page.locator('#post-body').focus();
	await page.keyboard.press('Tab');
	await expect(page.getByRole('button', { name: 'Add a photo (optional)' }).last()).toBeFocused();
});
