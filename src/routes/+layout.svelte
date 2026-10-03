<script lang="ts">
	import '../app.css';
	import { assets } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" type="image/svg+xml" href={`${assets}/favicon.svg`} /></svelte:head>
{@render children()}
