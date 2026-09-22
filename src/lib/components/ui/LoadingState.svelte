<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { LoaderCircle } from '@lucide/svelte';

	interface Props {
		status?: string;
		class?: string;
		children?: Snippet;
	}

	let { status = 'Loading...', class: className, children }: Props = $props();
</script>

<div
	role="status"
	aria-live="polite"
	class={cn('flex flex-col items-center justify-center gap-3 p-8 text-muted', className)}
>
	{#if children}
		{@render children()}
	{:else}
		<LoaderCircle class="size-6 animate-spin text-accent" aria-hidden="true" />
	{/if}

	<span class="text-sm font-medium text-ink">
		{status}
	</span>
</div>
