import { test, expect } from '@playwright/test';

test('renders saved sidebar dimensions before JavaScript and keeps them after refresh', async ({
	browser,
	baseURL
}) => {
	const context = await browser.newContext({
		javaScriptEnabled: false,
		viewport: { width: 1440, height: 900 }
	});
	try {
		await context.addCookies([
			{ name: 'claymore_sidebar_v1', value: 'expanded:304', url: baseURL! }
		]);
		const page = await context.newPage();
		await page.goto('/');
		await expect(page.locator('.desktop-sidebar')).toHaveCSS('width', '304px');
		await page.reload();
		await expect(page.locator('.desktop-sidebar')).toHaveCSS('width', '304px');
		await context.addCookies([
			{ name: 'claymore_sidebar_v1', value: 'collapsed:304', url: baseURL! }
		]);
		await page.reload();
		await expect(page.locator('.desktop-sidebar')).toHaveCSS('width', '64px');
		await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeVisible();
	} finally {
		await context.close();
	}
});

test('persists keyboard resizing and toggling for the next document', async ({ page, context }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	await expect
		.poll(
			async () =>
				(await context.cookies()).find((cookie) => cookie.name === 'claymore_sidebar_v1')?.value
		)
		.toBe('expanded:240');
	const handle = page.getByRole('separator', { name: 'Resize sidebar' });
	await handle.focus();
	await page.keyboard.press('End');
	await expect(page.locator('.desktop-sidebar')).toHaveCSS('width', '320px');
	await expect
		.poll(
			async () =>
				(await context.cookies()).find((cookie) => cookie.name === 'claymore_sidebar_v1')?.value
		)
		.toBe('expanded:320');
	await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
	await expect
		.poll(
			async () =>
				(await context.cookies()).find((cookie) => cookie.name === 'claymore_sidebar_v1')?.value
		)
		.toBe('collapsed:320');
	await page.reload();
	await expect(page.locator('.desktop-sidebar')).toHaveCSS('width', '64px');
});

function serialize(value: unknown): unknown[] {
	const items: unknown[] = [];
	function add(value: unknown): number {
		const index = items.length;
		items.push(null);
		if (value instanceof Date) items[index] = ['Date', value.toISOString()];
		else if (Array.isArray(value)) items[index] = value.map(add);
		else if (value && typeof value === 'object') {
			items[index] = Object.fromEntries(
				Object.entries(value).map(([key, entry]) => [key, add(entry)])
			);
		} else items[index] = value;
		return index;
	}
	add(value);
	return items;
}

test('keeps a photo-sized skeleton while the homepage image is pending and ends it on load or failure', async ({
	page
}) => {
	const photoId = 'photo-fixture';
	const post = {
		id: 'post-fixture',
		authorId: 'author',
		authorName: 'Ben',
		authorImage: null,
		body: 'An afternoon photo.',
		mediaId: photoId,
		createdAt: new Date(),
		replyCount: 0
	};
	await page.route('**/__data.json*', (route) =>
		route.fulfill({
			contentType: 'application/json',
			body:
				JSON.stringify({
					type: 'data',
					nodes: [
						{
							type: 'data',
							data: serialize({ user: null, session: null, sidebarPreference: null }),
							uses: {}
						},
						{
							type: 'data',
							data: serialize({
								posts: [post],
								nextCursor: null,
								loadError: false,
								search: '',
								trendingJournals: [],
								trendingError: false
							}),
							uses: { search_params: ['q'] }
						}
					]
				}) + '\n'
		})
	);
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/api/media/' + photoId, async (route) => {
		await pending;
		await route.fulfill({
			contentType: 'image/png',
			body: Buffer.from(
				'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1cAAAAASUVORK5CYII=',
				'base64'
			)
		});
	});
	try {
		await page.setViewportSize({ width: 320, height: 800 });
		await page.goto('/login');
		// Confirm hydration through a real UI change before navigating to mocked home data.
		await expect(async () => {
			if (!(await page.getByLabel('Your name', { exact: true }).isVisible())) {
				await page.getByRole('button', { name: 'Create an account', exact: true }).click();
			}
			await expect(page.getByLabel('Your name', { exact: true })).toBeVisible();
		}).toPass();
		await page.getByRole('link', { name: 'Claymore home' }).click();
		const skeleton = page.getByRole('status', { name: 'Loading photo' });
		await skeleton.scrollIntoViewIfNeeded();
		await expect(skeleton).toBeVisible();
		const bounds = await skeleton.boundingBox();
		expect(bounds!.width).toBeGreaterThan(200);
		expect(
			await skeleton.evaluate((el) => el.parentElement!.getBoundingClientRect().height)
		).toBeGreaterThanOrEqual(192);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		release();
		await expect(skeleton).toHaveCount(0);
		await expect(page.getByRole('img', { name: 'Post attachment' })).toBeVisible();
		const photo = page.getByRole('img', { name: 'Post attachment' });
		expect((await photo.boundingBox())!.width).toBeLessThan(200);
		post.mediaId = 'missing-photo-fixture';
		await page.route('**/api/media/missing-photo-fixture', (route) =>
			route.fulfill({ status: 404, body: '' })
		);
		await page.getByRole('searchbox', { name: 'Search moments' }).fill('missing');
		await page.getByRole('searchbox', { name: 'Search moments' }).press('Enter');
		await page.getByText('An afternoon photo.').scrollIntoViewIfNeeded();
		await expect(page.getByText(/Photo couldn/)).toBeVisible();
		await expect(skeleton).toHaveCount(0);
	} finally {
		release();
	}
});
