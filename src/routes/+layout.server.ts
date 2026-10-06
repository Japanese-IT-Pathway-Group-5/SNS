import type { LayoutServerLoad } from './$types';
import { parseSidebarPreference, SIDEBAR_COOKIE } from '$lib/navigation/sidebar';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	return {
		user: locals.user,
		session: locals.session,
		sidebarPreference: parseSidebarPreference(cookies.get(SIDEBAR_COOKIE))
	};
};
