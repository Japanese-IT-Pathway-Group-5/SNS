<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		variant?: 'accent' | 'peach' | 'lime' | 'muted' | 'danger';
		children?: Snippet;
	}

	let { variant = 'accent', class: className, children, ...restProps }: Props = $props();

	const variants = {
		accent: 'bg-accent-soft text-accent border-accent/20',
		peach: 'bg-peach/30 text-ink border-peach/50',
		lime: 'bg-lime/40 text-ink border-lime/60',
		muted: 'bg-surface-muted text-muted border-line',
		danger: 'bg-danger/10 text-danger border-danger/20'
	};
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors',
		variants[variant],
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</span>
