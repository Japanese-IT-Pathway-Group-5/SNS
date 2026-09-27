<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faCircleExclamation,
		faTriangleExclamation,
		faCircleCheck
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		type?: 'error' | 'warning' | 'success';
		message?: string;
		class?: string;
		children?: Snippet;
	}

	let { type = 'error', message, class: className, children }: Props = $props();

	const variantStyles = {
		error: 'bg-danger text-white border-transparent',
		warning: 'bg-peach-solid text-white border-transparent',
		success: 'bg-lime-solid text-white border-transparent'
	};

	let isAlert = $derived(type === 'error' || type === 'warning');
</script>

{#if message || children}
	<div
		role={isAlert ? 'alert' : 'status'}
		aria-live={type === 'error' ? 'assertive' : 'polite'}
		class={cn(
			'flex items-center gap-2.5 rounded-lg border p-3 text-sm font-medium shadow-xs transition-colors',
			variantStyles[type],
			className
		)}
	>
		{#if type === 'error'}
			<FontAwesomeIcon icon={faCircleExclamation} class="size-4 shrink-0 text-white" />
		{:else if type === 'warning'}
			<FontAwesomeIcon icon={faTriangleExclamation} class="size-4 shrink-0 text-white" />
		{:else}
			<FontAwesomeIcon icon={faCircleCheck} class="size-4 shrink-0 text-white" />
		{/if}

		<div>
			{#if message}
				<span>{message}</span>
			{/if}
			{#if children}
				{@render children()}
			{/if}
		</div>
	</div>
{/if}
