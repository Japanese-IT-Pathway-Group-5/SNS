import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

export interface AuthEnv {
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
}

export function createAuth(d1: D1Database, env?: AuthEnv | Env) {
	const db = getDb(d1);

	const googleClientId = env?.GOOGLE_CLIENT_ID ?? '';
	const googleClientSecret = env?.GOOGLE_CLIENT_SECRET ?? '';

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema
		}),
		secret: env?.BETTER_AUTH_SECRET,
		baseURL: env?.BETTER_AUTH_URL,
		socialProviders: {
			google: {
				clientId: googleClientId,
				clientSecret: googleClientSecret,
				enabled: Boolean(googleClientId && googleClientSecret)
			}
		}
	});
}

export const getAuth = createAuth;
export type Auth = ReturnType<typeof createAuth>;
