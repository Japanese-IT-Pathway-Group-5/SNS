<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSpinner } from '@fortawesome/free-solid-svg-icons';

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
		<FontAwesomeIcon icon={faSpinner} class="size-6 animate-spin text-accent" />
	{/if}

	<span class="text-sm font-medium text-ink">
		{status}
	</span>
</div>
