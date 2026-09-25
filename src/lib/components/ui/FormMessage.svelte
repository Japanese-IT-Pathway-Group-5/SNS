<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCircleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		type?: 'error' | 'success';
		message?: string;
		class?: string;
		children?: Snippet;
	}

	let { type = 'error', message, class: className, children }: Props = $props();
</script>

{#if message || children}
	<div
		role={type === 'error' ? 'alert' : 'status'}
		aria-live={type === 'error' ? 'assertive' : 'polite'}
		class={cn(
			'flex items-center gap-2 rounded-lg border p-3 text-sm font-medium',
			type === 'error'
				? 'border-danger/30 bg-danger/10 text-danger'
				: 'border-lime/50 bg-lime/25 text-ink',
			className
		)}
	>
		{#if type === 'error'}
			<FontAwesomeIcon icon={faCircleExclamation} class="size-4 shrink-0 text-danger" />
		{:else}
			<FontAwesomeIcon icon={faCircleCheck} class="size-4 shrink-0 text-accent" />
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
