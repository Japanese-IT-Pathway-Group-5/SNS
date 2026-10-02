<script lang="ts">
	import { Switch } from 'bits-ui';
	import { Button, Card, ModalDialog, Avatar } from '$lib/components/ui';
	import { onMount } from 'svelte';
	import { authClient } from '$lib/auth-client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let logoutDialogOpen = $state(false);
	let reduceMotion = $state(false);
	let isLoggingOut = $state(false);

	onMount(() => {
		reduceMotion = localStorage.getItem('reduceMotion') === 'true';
	});

	$effect(() => {
		if (reduceMotion) {
			localStorage.setItem('reduceMotion', 'true');
			document.documentElement.classList.add('reduce-motion');
		} else {
			localStorage.setItem('reduceMotion', 'false');
			document.documentElement.classList.remove('reduce-motion');
		}
	});

	async function handleLogout() {
		isLoggingOut = true;
		try {
			await authClient.signOut();
			window.location.href = '/login';
		} catch (error) {
			console.error('Logout failed:', error);
			isLoggingOut = false;
			logoutDialogOpen = false;
		}
	}

	let joinedDate = $derived(
		new Date(data.user.createdAt).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
</script>

<div class="mx-auto max-w-2xl px-4 py-8 sm:py-12">
	<h1 class="mb-8 text-3xl font-bold tracking-tight text-ink">Settings</h1>

	<div class="space-y-8">
		<!-- Account Card -->
		<Card class="overflow-hidden shadow-sm">
			<div class="flex items-center gap-5 bg-surface-muted/30 p-6 sm:p-8">
				<Avatar name={data.user.name} src={data.user.image} size="lg" />
				<div>
					<h2 class="text-xl font-bold text-ink sm:text-2xl">{data.user.name}</h2>
					<p class="text-muted">{data.user.email}</p>
				</div>
			</div>
			<div class="border-t border-line/60 bg-surface p-6 sm:p-8">
				<div class="flex items-center justify-between">
					<span class="font-medium text-ink">Member since</span>
					<span class="text-muted">{joinedDate}</span>
				</div>
			</div>
		</Card>

		<div class="space-y-4">
			<h2 class="text-xl font-bold text-ink">App Preferences</h2>
			<Card class="divide-y divide-line/60 shadow-sm">
				<div class="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
					<div class="max-w-md">
						<p class="text-lg font-bold text-ink">Reduce Motion</p>
						<p class="mt-1 text-sm leading-relaxed text-muted">
							Disables UI animations and transitions. Recommended if you prefer a simpler, faster
							feel or experience discomfort from motion.
						</p>
					</div>
					<Switch.Root
						bind:checked={reduceMotion}
						class="peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent data-[state=unchecked]:bg-line"
					>
						<Switch.Thumb
							class="pointer-events-none block h-6 w-6 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
						/>
					</Switch.Root>
				</div>

				<!-- Visual balance: A read-only setting so the card doesn't look empty -->
				<div class="flex items-center justify-between gap-4 p-6 sm:p-8">
					<div>
						<p class="text-lg font-bold text-ink">Language</p>
						<p class="mt-1 text-sm text-muted">Interface language</p>
					</div>
					<span
						class="rounded-lg border border-line bg-canvas px-4 py-1.5 text-sm font-medium text-ink"
					>
						English (US)
					</span>
				</div>
			</Card>
		</div>

		<!-- Logout Action -->
		<div class="pt-4">
			<Button
				variant="danger"
				class="w-full px-8 sm:w-auto"
				onclick={() => (logoutDialogOpen = true)}
			>
				Log Out
			</Button>
		</div>
	</div>
</div>

<ModalDialog
	bind:open={logoutDialogOpen}
	title="Log out"
	description="Are you sure you want to log out?"
>
	<p class="text-ink">You will need to sign back in with Google to access your journal.</p>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (logoutDialogOpen = false)} disabled={isLoggingOut}>
			Cancel
		</Button>
		<Button variant="danger" onclick={handleLogout} loading={isLoggingOut}>Log out</Button>
	{/snippet}
</ModalDialog>
