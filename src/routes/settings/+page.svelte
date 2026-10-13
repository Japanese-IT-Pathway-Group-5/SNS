<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Switch } from 'bits-ui';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
	import { AppShell, Button, BackButton } from '$lib/components/ui';
	import { clearUserDraft } from '$lib/drafts/persistence';
	import { getUiPreferences, t } from '$lib/preferences/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const ui = getUiPreferences();
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

<svelte:head><title>{t(ui, 'settings.title')} - Claymore</title></svelte:head>

<AppShell user={data.user}>
	<main class="w-full min-w-0">
		<header class="mb-6 sm:mb-8">
			<BackButton href={resolve('/')} label={t(ui, 'common.backHome')} class="mb-2 -ml-2" />
			<h1 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
				{t(ui, 'settings.title')}
			</h1>
			<p class="mt-2 text-sm leading-6 text-muted">{t(ui, 'settings.subtitle')}</p>
		</header>

		<div class="space-y-6">
			<section
				aria-labelledby="account-heading"
				class="rounded-xl border border-line bg-surface p-4 sm:p-6"
			>
				<h2 id="account-heading" class="text-base font-semibold text-ink">
					{t(ui, 'settings.account')}
				</h2>
				<div class="mt-4 border-b border-line pb-4">
					<p class="text-sm font-medium text-ink">{t(ui, 'settings.email')}</p>
					<p class="mt-1 text-sm break-all text-muted">{data.user.email}</p>
					<p class="mt-1 text-xs text-muted">{t(ui, 'settings.emailPrivate')}</p>
				</div>
				<div class="flex flex-wrap items-center justify-between gap-3 pt-4">
					<div class="min-w-0">
						<p class="text-sm font-medium text-ink">{t(ui, 'settings.profile')}</p>
						<p class="mt-1 text-sm leading-6 text-muted">
							{t(ui, 'settings.profileDescription')}
						</p>
					</div>
					<Button variant="link" size="sm" href={resolve('/profile/edit')} class="min-h-11 px-0">
						<span aria-hidden="true"><FontAwesomeIcon icon={faPenToSquare} class="size-3.5" /></span
						>
						{t(ui, 'settings.editProfile')}
					</Button>
				</div>
			</section>

			<section
				aria-labelledby="preferences-heading"
				class="rounded-xl border border-line bg-surface p-4 sm:p-6"
			>
				<h2 id="preferences-heading" class="text-base font-semibold text-ink">
					{t(ui, 'settings.preferences')}
				</h2>
				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<label class="space-y-1.5 text-sm font-medium text-ink">
						<span>{t(ui, 'settings.theme')}</span>
						<select
							bind:value={ui.theme}
							disabled={!ui.ready}
							class="min-h-11 w-full rounded-lg border border-control-border bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>
							<option value="system">{t(ui, 'settings.themeSystem')}</option>
							<option value="light">{t(ui, 'settings.themeLight')}</option>
							<option value="dark">{t(ui, 'settings.themeDark')}</option>
						</select>
					</label>
					<label class="space-y-1.5 text-sm font-medium text-ink">
						<span>{t(ui, 'settings.language')}</span>
						<select
							bind:value={ui.language}
							disabled={!ui.ready}
							class="min-h-11 w-full rounded-lg border border-control-border bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>
							<option value="en">{t(ui, 'settings.languageEnglish')}</option>
							<option value="ja">{t(ui, 'settings.languageJapanese')}</option>
						</select>
					</label>
				</div>
				<h3 class="mt-6 text-sm font-semibold text-ink">{t(ui, 'settings.appearance')}</h3>
				<div class="mt-4 flex items-center justify-between gap-4">
					<div class="min-w-0">
						<label for="reduce-motion" class="text-sm font-medium text-ink"
							>{t(ui, 'settings.reduceMotion')}</label
						>
						<p id="motion-description" class="mt-1 text-sm leading-6 text-muted">
							{t(ui, 'settings.reduceMotionDescription')}
						</p>
					</div>
					<Switch.Root
						id="reduce-motion"
						aria-label={t(ui, 'settings.reduceMotion')}
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
					{storageUnavailable ? t(ui, 'settings.storageUnavailable') : t(ui, 'settings.saved')}
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
						{t(ui, 'settings.signOut')}
					</Button>
				</form>
				<p class="mt-2 text-xs leading-5 text-muted">
					{t(ui, 'settings.signOutDescription')}
				</p>
			</div>
		</div>
	</main>
</AppShell>
