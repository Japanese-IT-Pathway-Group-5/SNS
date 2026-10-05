<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	import { cn } from '$lib/utils';
	let { src, alt, class: className, containerClass, loading = 'lazy' }: { src: string; alt: string; class?: string; containerClass?: string; loading?: 'lazy' | 'eager' } = $props();
	let image = $state<HTMLImageElement>();
	let loadedSrc = $state('');
	let failedSrc = $state('');
	let pending = $derived(loadedSrc !== src && failedSrc !== src);
	$effect(() => {
		const currentSrc = src;
		if (image?.complete && image.naturalWidth > 0) loadedSrc = currentSrc;
	});
</script>

<div class={cn('relative overflow-hidden', pending && 'min-h-48 w-full', containerClass)} aria-busy={pending}>
	{#key src}
		<img bind:this={image} {src} {alt} {loading} class={cn('block max-w-full h-auto', pending && 'opacity-0', failedSrc === src && 'hidden', className)} onload={() => loadedSrc = src} onerror={() => failedSrc = src} />
	{/key}
	{#if pending}<div class="absolute inset-0" role="status" aria-label="Loading photo"><Skeleton class="size-full rounded-none" /></div>{/if}
	{#if failedSrc === src}<p class="px-4 py-8 text-center text-sm text-muted" role="status">Photo couldn’t load.</p>{/if}
</div>
