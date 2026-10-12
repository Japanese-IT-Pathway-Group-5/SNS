import { describe, expect, it, vi } from 'vitest';
import { THEME_COOKIE } from '$lib/theme/theme';
import { actions, load } from './+page.server';

type ActionEvent = Parameters<NonNullable<typeof actions.setTheme>>[0];
type LoadEvent = Parameters<typeof load>[0];

function actionEvent(theme?: string) {
	const form = new FormData();
	if (theme !== undefined) form.set('theme', theme);
	const cookies = { set: vi.fn() };
	const event = {
		cookies,
		request: new Request('http://localhost/settings?/setTheme', { method: 'POST', body: form })
	} as unknown as ActionEvent;
	return { event, cookies };
}

function loadEvent(cookie?: string) {
	return {
		locals: { user: { id: 'account-a' }, session: { id: 'session-a' } },
		cookies: { get: (name: string) => (name === THEME_COOKIE ? cookie : undefined) }
	} as unknown as LoadEvent;
}

describe('settings theme action', () => {
	it.each(['system', 'light', 'dark'])('saves %s in a year-long device cookie', async (theme) => {
		const { event, cookies } = actionEvent(theme);

		expect(await actions.setTheme(event)).toEqual({ theme });
		expect(cookies.set).toHaveBeenCalledExactlyOnceWith(THEME_COOKIE, theme, {
			path: '/',
			maxAge: 31536000,
			sameSite: 'lax',
			httpOnly: true
		});
	});

	it.each([undefined, '', 'Dark', 'sepia', 'dark"><script>'])(
		'rejects %j without writing a cookie',
		async (theme) => {
			const { event, cookies } = actionEvent(theme);

			expect(await actions.setTheme(event)).toMatchObject({
				status: 400,
				data: { themeError: true }
			});
			expect(cookies.set).not.toHaveBeenCalled();
		}
	);
});

describe('settings load', () => {
	it('returns the saved theme', async () => {
		expect(await load(loadEvent('dark'))).toMatchObject({ theme: 'dark' });
	});

	it.each([undefined, 'neon'])('falls back to system for %j', async (cookie) => {
		expect(await load(loadEvent(cookie))).toMatchObject({ theme: 'system' });
	});
});
