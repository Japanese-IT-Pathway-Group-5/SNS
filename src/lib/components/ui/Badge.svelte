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
		accent: 'bg-accent text-white border-transparent',
		peach: 'bg-peach-solid text-white border-transparent',
		lime: 'bg-lime-solid text-white border-transparent',
		muted: 'bg-muted text-white border-transparent',
		danger: 'bg-danger text-white border-transparent'
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
