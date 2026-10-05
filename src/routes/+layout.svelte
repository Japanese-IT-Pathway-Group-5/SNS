<script lang="ts">
	import '../app.css';
	import { assets } from '$app/paths';
	import { setContext } from 'svelte';
	import { SIDEBAR_CONTEXT, type SidebarState } from '$lib/navigation/sidebar';

	const sidebar = $state<SidebarState>({ collapsed: false, width: 240, restored: false });
	setContext(SIDEBAR_CONTEXT, sidebar);

	let { children } = $props();
</script>

<svelte:head><link rel="icon" type="image/svg+xml" href={`${assets}/favicon.svg`} /></svelte:head>
{@render children()}
