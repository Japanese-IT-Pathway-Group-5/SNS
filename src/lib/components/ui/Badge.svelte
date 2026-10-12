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
		accent: 'bg-accent text-on-accent border-transparent',
		peach: 'bg-peach-solid text-on-accent border-transparent',
		lime: 'bg-lime-solid text-on-accent border-transparent',
		muted: 'bg-muted text-on-accent border-transparent',
		danger: 'bg-danger text-on-danger border-transparent'
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
