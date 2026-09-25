<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSpinner } from '@fortawesome/free-solid-svg-icons';
	import { cn } from '$lib/utils';

	interface BaseProps {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md';
		loading?: boolean;
		children?: Snippet;
		class?: string;
	}

	type ButtonAsButton = BaseProps &
		HTMLButtonAttributes & {
			href?: undefined;
		};

	type ButtonAsLink = BaseProps &
		HTMLAnchorAttributes & {
			href: string;
		};

	type Props = ButtonAsButton | ButtonAsLink;

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		class: className,
		children,
		...restProps
	}: Props = $props();

	const baseStyles =
		'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 select-none active:scale-[0.98] no-underline';

	const variants = {
		primary: 'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover shadow-xs',
		secondary:
			'bg-surface text-ink border border-control-border hover:bg-surface-muted active:bg-surface-muted',
		ghost: 'bg-transparent text-ink hover:bg-surface-muted active:bg-surface-muted',
		danger: 'bg-danger text-on-danger hover:opacity-90 active:opacity-95'
	};

	const sizes = {
		sm: 'text-sm px-3 py-1.5 min-h-[36px] gap-1.5',
		md: 'text-base px-4 py-2.5 min-h-[44px] gap-2'
	};
</script>

{#if 'href' in restProps && restProps.href}
	<a
		class={cn(baseStyles, variants[variant], sizes[size], className)}
		{...restProps as HTMLAnchorAttributes}
	>
		{#if loading}
			<FontAwesomeIcon icon={faSpinner} class="size-4 animate-spin text-current" />
		{/if}
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	{@const buttonProps = restProps as HTMLButtonAttributes}
	<button
		type={buttonProps.type ?? 'button'}
		disabled={buttonProps.disabled || loading}
		class={cn(baseStyles, variants[variant], sizes[size], className)}
		aria-busy={loading}
		{...buttonProps}
	>
		{#if loading}
			<FontAwesomeIcon icon={faSpinner} class="size-4 animate-spin text-current" />
		{/if}
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}
