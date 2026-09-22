<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		src?: string | null;
		alt?: string;
		name?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { src, alt = '', name = '', size = 'md', class: className }: Props = $props();

	let imageFailed = $state(false);

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
	{#if src && !imageFailed}
		<img
			{src}
			alt={alt || name || 'User avatar'}
			class="size-full object-cover"
			onerror={() => (imageFailed = true)}
		/>
	{:else}
		<span aria-hidden="true">{initials}</span>
	{/if}
</div>
