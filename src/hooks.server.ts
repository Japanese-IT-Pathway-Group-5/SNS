import { getAuth } from '$lib/server/auth';
import { addSecurityHeaders } from '$lib/server/security/headers';
import { sanitizeRedirectUrl } from '$lib/utils';
import { redirect, type Handle } from '@sveltejs/kit';

const PUBLIC_PREFIXES = [
	'/login',
	'/api/auth',
	'/api/posts',
	'/api/replies',
	'/api/media',
	'/post',
	'/dev',
	'/demo'
];
const STATIC_PUBLIC_FILES = ['/favicon.svg', '/favicon.ico', '/robots.txt'];

export const isPublicRoute = (pathname: string): boolean => {
	if (pathname === '/') return true;
	if (PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
		return true;
	}
	if (pathname.startsWith('/_app/')) {
		return true;
	}
	return STATIC_PUBLIC_FILES.includes(pathname);
};

export const handle: Handle = async ({ event, resolve }) => {
	const isAuthApiRoute = event.url.pathname.startsWith('/api/auth');

	if (!isAuthApiRoute) {
		if (event.platform?.env?.DB) {
			try {
				const auth = getAuth(event.platform.env.DB, event.platform.env);
				const sessionData = await auth.api.getSession({
					headers: event.request.headers
				});

				event.locals.user = sessionData?.user ?? null;
				event.locals.session = sessionData?.session ?? null;
			} catch (error) {
				console.error('Failed to read session:', error);
				event.locals.user = null;
				event.locals.session = null;
			}
		} else if (!event.locals.user) {
			event.locals.user = null;
			event.locals.session = null;
		}

		const isPublic = isPublicRoute(event.url.pathname);

		if (!isPublic && !event.locals.user) {
			const destination = event.url.pathname + event.url.search;
			const loginUrl =
				destination !== '/' ? `/login?redirectTo=${encodeURIComponent(destination)}` : '/login';

			redirect(303, loginUrl);
		}

		if (event.url.pathname === '/login' && event.locals.user) {
			const rawDestination = event.url.searchParams.get('redirectTo');
			const destination = sanitizeRedirectUrl(rawDestination, '/');

			redirect(303, destination);
		}
	}

	const response = await resolve(event);

	return addSecurityHeaders(response);
};
