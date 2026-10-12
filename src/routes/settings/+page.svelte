<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Switch } from 'bits-ui';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
	import { AppShell, Button, BackButton } from '$lib/components/ui';
	import { clearUserDraft } from '$lib/drafts/persistence';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import { parseThemePreference } from '$lib/theme/theme';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const themeOptions = [
		{ value: 'system', label: 'System', icon: Monitor },
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon }
	] as const;
	let theme = $derived(data.theme);
	let themeFailed = $state(false);

	const submitTheme: SubmitFunction = ({ formData }) => {
		const previous = theme;
		theme = parseThemePreference(formData.get('theme'));
		document.documentElement.dataset.theme = theme;
		themeFailed = false;
		return async ({ result, update }) => {
			if (result.type !== 'success') {
				theme = previous;
				document.documentElement.dataset.theme = previous;
				themeFailed = result.type !== 'redirect';
			}
			// An expired session redirects to sign-in; other failures keep the page and show the message.
			if (result.type === 'success' || result.type === 'redirect') await update({ reset: false });
		};
	};

	let reduceMotion = $state(false);
	let preferencesReady = $state(false);
	let storageUnavailable = $state(false);
	let isLoggingOut = $state(false);

	onMount(() => {
		try {
			const saved = localStorage.getItem('reduceMotion');
			reduceMotion =
				saved === null
					? window.matchMedia('(prefers-reduced-motion: reduce)').matches
					: saved === 'true';
		} catch {
			reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		}
		preferencesReady = true;
	});

	$effect(() => {
		if (!preferencesReady) return;
		document.documentElement.classList.toggle('reduce-motion', reduceMotion);
		try {
			localStorage.setItem('reduceMotion', String(reduceMotion));
			storageUnavailable = false;
		} catch {
			storageUnavailable = true;
		}
	});
</script>

<svelte:head><title>Account &amp; settings - Claymore</title></svelte:head>

<AppShell user={data.user}>
	<main class="w-full min-w-0">
		<header class="mb-6 sm:mb-8">
			<BackButton href={resolve('/')} class="mb-2 -ml-2" />
			<h1 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
				Account &amp; settings
			</h1>
			<p class="mt-2 text-sm leading-6 text-muted">Your account and a few personal preferences.</p>
		</header>

		<div class="space-y-6">
			<section
				aria-labelledby="account-heading"
				class="rounded-xl border border-line bg-surface p-4 sm:p-6"
			>
				<h2 id="account-heading" class="text-base font-semibold text-ink">Account</h2>
				<div class="mt-4 border-b border-line pb-4">
					<p class="text-sm font-medium text-ink">Email</p>
					<p class="mt-1 text-sm break-all text-muted">{data.user.email}</p>
					<p class="mt-1 text-xs text-muted">Only visible to you.</p>
				</div>
				<div class="flex flex-wrap items-center justify-between gap-3 pt-4">
					<div class="min-w-0">
						<p class="text-sm font-medium text-ink">Profile</p>
						<p class="mt-1 text-sm leading-6 text-muted">
							Your name, photo, description and banner.
						</p>
					</div>
					<Button variant="link" size="sm" href={resolve('/profile/edit')} class="min-h-11 px-0">
						<span aria-hidden="true"><FontAwesomeIcon icon={faPenToSquare} class="size-3.5" /></span
						>
						Edit profile
					</Button>
				</div>
			</section>

			<section
				aria-labelledby="preferences-heading"
				class="rounded-xl border border-line bg-surface p-4 sm:p-6"
			>
				<h2 id="preferences-heading" class="text-base font-semibold text-ink">Preferences</h2>
				<form
					method="POST"
					action={`${resolve('/settings')}?/setTheme`}
					use:enhance={submitTheme}
					class="mt-4 border-b border-line pb-4"
				>
					<fieldset class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
						<div class="min-w-0">
							<legend class="float-left text-sm font-medium text-ink">Theme</legend>
							<p id="theme-description" class="clear-both pt-1 text-sm leading-6 text-muted">
								System follows your device setting.
							</p>
						</div>
						<div
							class="inline-flex shrink-0 gap-1 rounded-lg border border-control-border bg-surface p-1"
						>
							{#each themeOptions as option (option.value)}
								<label
									class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-muted has-checked:bg-accent has-checked:text-on-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
								>
									<input
										type="radio"
										name="theme"
										value={option.value}
										checked={theme === option.value}
										aria-describedby="theme-description"
										class="sr-only"
										onchange={(event) => event.currentTarget.form?.requestSubmit()}
									/>
									<option.icon class="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
									{option.label}
								</label>
							{/each}
						</div>
					</fieldset>
					<noscript>
						<Button variant="secondary" size="sm" type="submit" class="mt-3">Save theme</Button>
					</noscript>
					{#if themeFailed || form?.themeError}
						<p role="alert" class="mt-3 text-sm text-danger">
							Your theme could not be saved. Please try again.
						</p>
					{/if}
				</form>
				<div class="mt-4 flex items-center justify-between gap-4">
					<div class="min-w-0">
						<label for="reduce-motion" class="text-sm font-medium text-ink">Reduce motion</label>
						<p id="motion-description" class="mt-1 text-sm leading-6 text-muted">
							Keep animations and transitions to a minimum.
						</p>
					</div>
					<Switch.Root
						id="reduce-motion"
						aria-label="Reduce motion"
						aria-describedby="motion-description"
						bind:checked={reduceMotion}
						disabled={!preferencesReady}
						class="inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50 data-[state=checked]:bg-accent data-[state=unchecked]:bg-control-border"
					>
						<Switch.Thumb
							class="pointer-events-none block size-6 rounded-full bg-surface shadow-xs transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
						/>
					</Switch.Root>
				</div>
				<p class="mt-4 text-xs text-muted">
					{storageUnavailable
						? 'Applies for this visit. Device saving is unavailable.'
						: 'Saved on this device.'}
				</p>
			</section>

			<div class="border-t border-line pt-5">
				<form
					method="POST"
					action={resolve('/logout')}
					onsubmit={() => {
						isLoggingOut = true;
						clearUserDraft(data.user.id);
					}}
				>
					<Button
						variant="secondary"
						size="sm"
						type="submit"
						loading={isLoggingOut}
						disabled={isLoggingOut}
					>
						<LogOut class="size-4" strokeWidth={1.75} aria-hidden="true" />
						Sign out
					</Button>
				</form>
				<p class="mt-2 text-xs leading-5 text-muted">
					Signing out clears your draft saved on this device.
				</p>
			</div>
		</div>
	</main>
</AppShell>
