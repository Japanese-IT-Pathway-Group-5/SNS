import { getAuth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		if (platform?.env?.DB) {
			const auth = getAuth(platform.env.DB, platform.env);
			try {
				await auth.api.signOut({ headers: request.headers });
			} catch {
				// Session may already be invalid; continue to clear cookies
			}
		}

		for (const cookie of cookies.getAll()) {
			if (cookie.name.startsWith('better-auth') || cookie.name.startsWith('__Secure-better-auth')) {
				cookies.delete(cookie.name, { path: '/' });
			}
		}

		redirect(303, '/login');
	}
};
