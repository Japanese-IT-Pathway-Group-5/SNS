import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession } = authClient;

export const signInWithGoogle = async (callbackURL = '/') => {
	return authClient.signIn.social({
		provider: 'google',
		callbackURL
	});
};
