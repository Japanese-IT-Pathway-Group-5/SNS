import { redirect } from '@sveltejs/kit';
import { sanitizeRedirectUrl } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	const redirectTo = sanitizeRedirectUrl(url.searchParams.get('redirectTo'), '/');

	if (!locals.user) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return { redirectTo };
};
