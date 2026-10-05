import { test, expect } from '@playwright/test';

// Mock only browser data/action responses; the application has no test-auth bypass.
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

test('opens profile editing, preserves failed fields, previews/removes photos and saves back to the journal', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	const user = {
		id: 'profile-fixture',
		name: 'Aiko Tanaka',
		email: 'layout@example.invalid',
		emailVerified: true,
		image: null,
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01')
	};
	let description = 'Small discoveries and home cooking.';
	let banner = '';
	let attempt = 0;
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.route('**/__data.json*', (route) => {
		const path = new URL(route.request().url()).pathname;
		const data = path.startsWith('/profile/edit/')
			? { profile: { name: user.name, image: user.image, description, banner } }
			: path.startsWith('/journal/')
				? {
						posts: [],
						nextCursor: null,
						loadError: false,
						description,
						banner,
						profileError: false
					}
				: {
						posts: [],
						nextCursor: null,
						loadError: false,
						search: 'layout',
						trendingJournals: [],
						trendingError: false
					};
		return route.fulfill({
			contentType: 'application/json',
			body:
				JSON.stringify({
					type: 'data',
					nodes: [
						{ type: 'data', data: serialize({ user, session: null }), uses: {} },
						{ type: 'data', data: serialize(data), uses: {} }
					]
				}) + '\n'
		});
	});
	await page.route('**/profile/edit', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		attempt++;
		if (attempt === 1) {
			await pending;
			return route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({
					type: 'failure',
					status: 503,
					data: JSON.stringify(
						serialize({ message: 'Could not save your profile. Please try again.' })
					)
				})
			});
		}
		user.name = 'Aiko';
		description = '今日 🌱\nLittle moments.';
		return route.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({ type: 'redirect', status: 303, location: '/journal' })
		});
	});
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.getByRole('searchbox', { name: 'Search moments' }).fill('layout');
	await page.getByRole('searchbox', { name: 'Search moments' }).press('Enter');
	await expect(page.getByRole('button', { name: 'User menu', exact: true })).toBeVisible();
	const home = await page.locator('#feed').boundingBox();
	await page
		.locator('.desktop-sidebar')
		.getByRole('link', { name: 'My journal', exact: true })
		.click();
	await page.getByRole('link', { name: 'Edit profile', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Edit profile', exact: true })).toBeVisible();
	const edit = await page.locator('.shell-reading').boundingBox();
	expect(edit?.x).toBe(home?.x);
	expect(edit?.width).toBe(home?.width);
	await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Aiko Tanaka');
	await expect(page.getByRole('textbox', { name: 'Description', exact: true })).toHaveValue(
		description
	);
	const sidebarWidth = await page
		.locator('.desktop-sidebar')
		.evaluate((node) => node.getBoundingClientRect().width);
	await page.getByRole('button', { name: 'Draw your banner', exact: true }).click();
	const canvas = page.getByRole('application', { name: 'Banner drawing canvas' });
	await canvas.focus();
	await page.keyboard.press('Space');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Space');
	await expect(canvas.locator('polyline')).toHaveCount(1);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(canvas.locator('polyline')).toHaveCount(0);
	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect(canvas.locator('polyline')).toHaveCount(1);
	await page.getByRole('button', { name: 'Marker', exact: true }).click();
	const bounds = (await canvas.boundingBox())!;
	await page.mouse.move(bounds.x + 20, bounds.y + 20);
	await page.mouse.down();
	await page.mouse.move(bounds.x + 90, bounds.y + 70, { steps: 5 });
	await page.mouse.up();
	await expect(canvas.locator('polyline')).toHaveCount(2);
	await page.getByRole('button', { name: 'Use drawing', exact: true }).click();
	banner = await page.locator('input[name="banner"]').inputValue();
	expect(JSON.parse(banner).strokes).toHaveLength(2);
	await page.getByRole('button', { name: 'Edit drawing', exact: true }).click();
	await page.getByRole('button', { name: 'Clear canvas', exact: true }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
	await expect(page.locator('input[name="banner"]')).toHaveValue(banner);
	const png = Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0foAAAAASUVORK5CYII=',
		'base64'
	);
	await page
		.locator('#profile-photo')
		.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });
	await expect(page.locator('main img')).toHaveAttribute('src', /^blob:/);
	await page.getByRole('checkbox', { name: 'Remove profile photo', exact: true }).check();
	expect(
		await page.locator('#profile-photo').evaluate((el) => (el as HTMLInputElement).files?.length)
	).toBe(0);
	await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Aiko');
	await page
		.getByRole('textbox', { name: 'Description', exact: true })
		.fill('今日 🌱\nLittle moments.');
	await page.getByRole('button', { name: 'Save profile', exact: true }).click();
	await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeDisabled();
	release();
	await expect(page.getByRole('alert')).toContainText('Could not save your profile');
	await expect(page.locator('input[name="banner"]')).toHaveValue(banner);
	await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Aiko');
	await expect(page.getByRole('textbox', { name: 'Description', exact: true })).toHaveValue(
		'今日 🌱\nLittle moments.'
	);
	await page.getByRole('button', { name: 'Save profile', exact: true }).click();
	await expect(page).toHaveURL(/\/journal$/);
	await expect(page.locator('#journal h1')).toHaveText('Aiko');
	await expect(page.locator('#journal header polyline')).toHaveCount(2);
	expect(
		await page.locator('.desktop-sidebar').evaluate((node) => node.getBoundingClientRect().width)
	).toBe(sidebarWidth);
	await expect(page.locator('#journal header')).toContainText('今日 🌱');
	await page.getByRole('link', { name: 'Edit profile', exact: true }).click();
	await page.setViewportSize({ width: 320, height: 720 });
	await page.getByRole('button', { name: 'Edit drawing', exact: true }).click();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	const mobileEditor = await page.getByRole('dialog').boundingBox();
	expect(mobileEditor?.x).toBe(0);
	expect(mobileEditor?.y).toBe(0);
	expect(mobileEditor?.width).toBe(320);
	expect(mobileEditor?.height).toBe(720);
	await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page.getByRole('link', { name: 'Cancel', exact: true }).click();
	await expect(page).toHaveURL(/\/journal$/);
	expect(errors).toEqual([]);
});
