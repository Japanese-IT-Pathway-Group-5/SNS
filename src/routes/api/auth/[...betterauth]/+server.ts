import { getAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const handleAuth: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return new Response('Database binding missing', { status: 500 });
	}

	const auth = getAuth(platform.env.DB, platform.env);
	return auth.handler(request);
};

export const GET: RequestHandler = handleAuth;
export const POST: RequestHandler = handleAuth;
