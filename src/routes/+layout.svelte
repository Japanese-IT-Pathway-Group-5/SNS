<script lang="ts">
	import '../app.css';
	import { assets } from '$app/paths';
	import { onMount, setContext } from 'svelte';
	import { UI_PREFERENCES_CONTEXT, type UiPreferences } from '$lib/preferences/ui';
	import { SIDEBAR_CONTEXT, type SidebarState } from '$lib/navigation/sidebar';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	// Seed once per document; client navigation must retain the current sidebar state.
	function initialSidebar(): SidebarState {
		return {
			collapsed: data.sidebarPreference?.collapsed ?? false,
			width: data.sidebarPreference?.width ?? 240,
			restored: Boolean(data.sidebarPreference)
		};
	}
	const sidebar = $state<SidebarState>(initialSidebar());
	const preferences = $state<UiPreferences>({ language: 'en', theme: 'system', ready: false });
	setContext(SIDEBAR_CONTEXT, sidebar);
	setContext(UI_PREFERENCES_CONTEXT, preferences);

	onMount(() => {
		try {
			const language = localStorage.getItem('claymore_language');
			const theme = localStorage.getItem('claymore_theme');
			if (language === 'en' || language === 'ja') preferences.language = language;
			if (theme === 'system' || theme === 'light' || theme === 'dark') preferences.theme = theme;
		} catch {
			// Defaults remain available when browser storage is disabled.
		}
		preferences.ready = true;
	});

	$effect(() => {
		if (!preferences.ready) return;
		document.documentElement.lang = preferences.language;
		try {
			localStorage.setItem('claymore_language', preferences.language);
			localStorage.setItem('claymore_theme', preferences.theme);
		} catch {
			// Current-visit preferences still apply without persistent storage.
		}

		const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
		const applyTheme = () => {
			const useDark =
				preferences.theme === 'dark' || (preferences.theme === 'system' && systemDark.matches);
			document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
		};
		applyTheme();
		systemDark.addEventListener('change', applyTheme);
		return () => systemDark.removeEventListener('change', applyTheme);
	});
</script>

<svelte:head><link rel="icon" type="image/svg+xml" href={`${assets}/favicon.svg`} /></svelte:head>
{@render children()}
