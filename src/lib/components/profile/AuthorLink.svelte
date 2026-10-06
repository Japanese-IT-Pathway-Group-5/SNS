<script lang="ts">
	import { resolve } from '$app/paths';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	let {
		id,
		name,
		image,
		size = 'md'
	}: { id?: string; name: string; image?: string | null; size?: 'sm' | 'md' } = $props();
</script>

{#snippet identity()}
	<Avatar src={image} {name} {size} />
	<span class="min-w-0 font-semibold break-words text-ink group-hover/author:underline">{name}</span
	>
{/snippet}
{#if id}
	<a
		href={resolve('/profile/[userId]', { userId: id })}
		aria-label={`View ${name}'s profile`}
		class="group/author flex min-h-11 min-w-0 items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
		>{@render identity()}</a
	>
{:else}
	<div class="flex min-w-0 items-center gap-3">{@render identity()}</div>
{/if}
