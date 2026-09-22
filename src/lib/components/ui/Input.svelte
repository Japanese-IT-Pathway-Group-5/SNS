<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLInputAttributes {
		label?: string;
		description?: string;
		error?: string;
		id?: string;
	}

	let {
		label,
		description,
		error,
		id = `input-${Math.random().toString(36).slice(2, 9)}`,
		disabled = false,
		required = false,
		class: className,
		value = $bindable(''),
		...restProps
	}: Props = $props();

	let descriptionId = $derived(`${id}-description`);
	let errorId = $derived(`${id}-error`);
</script>

<div class="flex w-full flex-col gap-1.5">
	{#if label}
		<label for={id} class="flex items-center gap-1 text-sm font-semibold text-ink">
			{label}
			{#if required}
				<span class="text-danger" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}

	<input
		{id}
		{disabled}
		{required}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? errorId : description ? descriptionId : undefined}
		class={cn(
			'w-full rounded-lg border bg-surface px-3.5 py-2.5 text-base text-ink transition-colors',
			'placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none',
			error
				? 'border-danger focus-visible:ring-danger'
				: 'border-control-border hover:border-accent',
			disabled && 'cursor-not-allowed bg-surface-muted opacity-60',
			className
		)}
		{...restProps}
	/>

	{#if description && !error}
		<p id={descriptionId} class="text-xs text-muted">
			{description}
		</p>
	{/if}

	{#if error}
		<p id={errorId} class="text-xs font-medium text-danger" role="alert">
			{error}
		</p>
	{/if}
</div>
