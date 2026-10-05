<script lang="ts">
	import { cn } from '$lib/utils';
	import Skeleton from './Skeleton.svelte';

	interface Props {
		src?: string | null;
		alt?: string;
		name?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { src, alt = '', name = '', size = 'md', class: className }: Props = $props();

	let failedSrc = $state<string | null>(null);
	let loadedSrc = $state<string | null>(null);
	let image = $state<HTMLImageElement>();
	$effect(() => {
		const currentSrc = src;
		if (image?.complete && image.naturalWidth > 0) loadedSrc = currentSrc ?? null;
	});

	let initials = $derived.by(() => {
		if (!name) return '?';
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	});

	const sizes = {
		sm: 'size-8 text-xs',
		md: 'size-10 text-sm',
		lg: 'size-12 text-base'
	};
</script>

<div
	class={cn(
		'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-accent-soft font-medium text-accent select-none',
		sizes[size],
		className
	)}
>
	{#if src && failedSrc !== src}
		{#key src}
		<img
			bind:this={image}
			{src}
			alt={alt || name || 'User avatar'}
			class="size-full object-cover"
			class:opacity-0={loadedSrc !== src}
			onload={() => loadedSrc = src ?? null}
			onerror={() => failedSrc = src ?? null}
		/>
		{/key}
		{#if loadedSrc !== src}<div class="absolute inset-0"><Skeleton class="size-full rounded-full" /></div>{/if}
	{:else}
		<span aria-hidden="true">{initials}</span>
	{/if}
</div>
