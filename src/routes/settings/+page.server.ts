import { fail, redirect } from '@sveltejs/kit';
import {
	isThemePreference,
	parseThemePreference,
	THEME_COOKIE,
	THEME_COOKIE_MAX_AGE
} from '$lib/theme/theme';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user || !locals.session) {
		redirect(302, '/login');
	}

	return {
		user: locals.user,
		session: locals.session,
		theme: parseThemePreference(cookies.get(THEME_COOKIE))
	};
};

export const actions: Actions = {
	setTheme: async ({ request, cookies }) => {
		const theme = (await request.formData()).get('theme');
		if (!isThemePreference(theme)) {
			return fail(400, { themeError: true });
		}

		cookies.set(THEME_COOKIE, theme, {
			path: '/',
			maxAge: THEME_COOKIE_MAX_AGE,
			sameSite: 'lax',
			httpOnly: true
		});

		return { theme };
	}
};
