<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBookOpen } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		title: string;
		description?: string;
		class?: string;
		icon?: Snippet;
		action?: Snippet;
	}

	let { title, description, class: className, icon, action }: Props = $props();
</script>

<div
	class={cn(
		'mx-auto flex max-w-lg flex-col items-center justify-center gap-3 rounded-xl border border-line/60 bg-surface/50 p-8 text-center sm:p-12',
		className
	)}
>
	<div class="mb-1 rounded-full bg-surface-muted p-3 text-accent">
		{#if icon}
			{@render icon()}
		{:else}
			<FontAwesomeIcon icon={faBookOpen} class="size-6 text-accent" />
		{/if}
	</div>

	<h3 class="text-lg font-semibold text-ink">
		{title}
	</h3>

	{#if description}
		<p class="max-w-sm text-sm text-muted">
			{description}
		</p>
	{/if}

	{#if action}
		<div class="mt-2">
			{@render action()}
		</div>
	{/if}
</div>
