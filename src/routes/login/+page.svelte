<script lang="ts">
	import { page } from '$app/state';
	import { signInWithGoogle } from '$lib/auth-client';
	import { Badge, Button, Card } from '$lib/components/ui';
	import { sanitizeRedirectUrl } from '$lib/utils';

	let isSigningIn = $state(false);
	let errorMessage = $state<string | null>(null);

	const redirectTo = $derived(sanitizeRedirectUrl(page.url.searchParams.get('redirectTo'), '/'));

	async function handleGoogleSignIn() {
		isSigningIn = true;
		errorMessage = null;

		try {
			await signInWithGoogle(redirectTo);
		} catch (err) {
			console.error('Sign in failed:', err);
			errorMessage = 'Could not initiate Google sign in. Please try again.';
			isSigningIn = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In — SNS</title>
</svelte:head>

<main class="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-12 text-center">
	<div class="space-y-4">
		<div class="flex items-center justify-center gap-2">
			<Badge variant="lime">Pilot</Badge>
			<Badge variant="peach">Everyday Journal</Badge>
		</div>

		<h1 class="text-3xl font-bold tracking-tight text-ink sm:text-4xl">SNS</h1>
		<p class="text-base text-muted">"Your day doesn't have to be special to be worth sharing."</p>
	</div>

	<Card variant="surface" class="mt-8 space-y-6 text-left">
		<div class="space-y-1 text-center">
			<h2 class="text-lg font-bold text-ink">Welcome back</h2>
			<p class="text-xs text-muted">
				Sign in with your Google account to access your journal and feed.
			</p>
		</div>

		{#if errorMessage}
			<div
				role="alert"
				class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
			>
				{errorMessage}
			</div>
		{/if}

		<div class="space-y-3">
			<Button
				variant="primary"
				class="w-full justify-center py-2.5 text-sm font-semibold"
				onclick={handleGoogleSignIn}
				disabled={isSigningIn}
			>
				{#if isSigningIn}
					<span>Connecting to Google...</span>
				{:else}
					<span>Sign in with Google</span>
				{/if}
			</Button>

			<p class="text-center text-[11px] text-muted">
				Shared with pilot members only. Unapproved accounts cannot post.
			</p>
		</div>
	</Card>
</main>
