import { createAuthClient } from 'better-auth/svelte';

const getAuthBaseURL = () => {
	if (import.meta.env.VITE_BETTER_AUTH_URL) {
		return import.meta.env.VITE_BETTER_AUTH_URL as string;
	}
	if (typeof window !== 'undefined') {
		const isLocal =
			window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
		if (isLocal) {
			return window.location.origin;
		}
	}
	return undefined;
};

const baseURL = getAuthBaseURL();

export const authClient = createAuthClient(baseURL ? { baseURL } : {});

export const { signIn, signOut, signUp, useSession } = authClient;

export const signInWithGoogle = async (callbackURL = '/') => {
	const resolvedCallbackURL =
		typeof window !== 'undefined' && callbackURL.startsWith('/')
			? `${window.location.origin}${callbackURL}`
			: callbackURL;

	return authClient.signIn.social({
		provider: 'google',
		callbackURL: resolvedCallbackURL
	});
};
