import { getAuth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const isPublicRoute = (pathname: string): boolean => {
	const publicPrefixes = ['/login', '/api/auth', '/dev', '/demo'];
	return (
		publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
		pathname.startsWith('/_app') ||
		pathname.includes('.')
	);
};

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/auth')) {
		return resolve(event);
	}

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
		const destination = event.url.searchParams.get('redirectTo') || '/';
		redirect(303, destination);
	}

	return resolve(event);
};
