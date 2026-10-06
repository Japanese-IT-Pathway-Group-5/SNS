<script lang="ts">
	import '../app.css';
	import { assets } from '$app/paths';
	import { setContext } from 'svelte';
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
	setContext(SIDEBAR_CONTEXT, sidebar);
</script>

<svelte:head><link rel="icon" type="image/svg+xml" href={`${assets}/favicon.svg`} /></svelte:head>
{@render children()}
