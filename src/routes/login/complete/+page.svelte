<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoadingState } from '$lib/components/ui';
	import { getUiPreferences, t } from '$lib/preferences/ui';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const ui = getUiPreferences();

	onMount(() => {
		// The server load sanitizes this destination, which may include query parameters.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(data.redirectTo, { replaceState: true, noScroll: true }).catch(() => {
			window.location.replace(data.redirectTo);
		});
	});
</script>

<svelte:head>
	<title>{t(ui, 'loginComplete.opening')}</title>
	<meta name="description" content={t(ui, 'loginComplete.opening')} />
</svelte:head>

<main class="flex min-h-svh items-center justify-center bg-canvas">
	<LoadingState status={t(ui, 'loginComplete.opening')} />
</main>
