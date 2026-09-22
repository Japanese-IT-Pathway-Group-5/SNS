<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: 'surface' | 'muted' | 'outline';
		children?: Snippet;
	}

	let { variant = 'surface', class: className, children, ...restProps }: Props = $props();

	const variants = {
		surface: 'bg-surface border border-line rounded-xl shadow-xs',
		muted: 'bg-surface-muted border border-line rounded-xl',
		outline: 'bg-transparent border border-line rounded-xl'
	};
</script>

<div class={cn('p-4 transition-colors sm:p-5', variants[variant], className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</div>
