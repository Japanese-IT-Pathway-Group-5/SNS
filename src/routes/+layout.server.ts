import { getMembership } from '$lib/server/auth/authorization';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	let isModerator = false;

	if (locals.user) {
		const d1 = platform?.env?.DB;
		if (d1) {
			try {
				const m = await getMembership(d1, locals.user.id);
				isModerator = m?.role === 'moderator';
			} catch {
				// DB unavailable — default to no moderator access.
			}
		}
	}

	return {
		user: locals.user,
		session: locals.session,
		isModerator
	};
};
