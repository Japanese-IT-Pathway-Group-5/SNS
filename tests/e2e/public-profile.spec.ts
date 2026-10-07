import { test, expect } from '@playwright/test';
import { serialize } from './helpers';

test('opens an author profile, paginates, handles failure and empty states on mobile', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	let mode = 'entries';
	const profile = {
		id: 'author-fixture',
		name: 'Aiko Tanaka',
		image: null,
		description: 'Everyday discoveries \u{1f331}',
		banner: ''
	};
	const post = {
		id: 'post-fixture',
		authorId: profile.id,
		authorName: profile.name,
		authorImage: null,
		body: 'A quiet afternoon.',
		mediaId: null,
		createdAt: new Date('2026-10-01'),
		replyCount: 0
	};
	await page.route('**/__data.json*', (route) => {
		const path = new URL(route.request().url()).pathname;
		const data = path.startsWith('/profile/')
			? {
					profile,
					posts: mode === 'entries' ? [post] : [],
					nextCursor: mode === 'entries' ? 'older-token' : null,
					loadError: mode === 'failure'
				}
			: {
					posts: [post],
					nextCursor: null,
					loadError: false,
					search: '',
					trendingJournals: [],
					trendingError: false
				};
		return route.fulfill({
			contentType: 'application/json',
			body:
				JSON.stringify({
					type: 'data',
					nodes: [
						{ type: 'data', data: serialize({ user: null, session: null }), uses: {} },
						{
							type: 'data',
							data: serialize(data),
							uses: { params: ['userId'], search_params: ['cursor'] }
						}
					]
				}) + '\n'
		});
	});
	await page.goto('/login');
	await page.locator('a[href="/"]').first().click();
	const author = page.getByRole('link', { name: "View Aiko Tanaka's profile" }).first();
	await author.focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/profile\/author-fixture/);
	await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeVisible();
	await expect(page.getByText(profile.description)).toBeVisible();
	await expect(page.getByRole('link', { name: 'Edit profile' })).toHaveCount(0);
	await expect(page.getByText('Visible to everyone. Newest first.')).toBeVisible();
	await page.setViewportSize({ width: 320, height: 740 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	mode = 'failure';
	await page.getByRole('link', { name: 'Older entries' }).click();
	await expect(page.getByText('This journal could not load. Please try again.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Try again' })).toBeVisible();
	mode = 'empty';
	await page.getByRole('link', { name: 'Back to newest' }).click();
	await expect(page.getByRole('heading', { name: 'No entries yet' })).toBeVisible();
	expect(errors).toEqual([]);
});
