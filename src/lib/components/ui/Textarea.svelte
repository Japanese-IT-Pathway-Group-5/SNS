<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLTextareaAttributes {
		label?: string;
		description?: string;
		error?: string;
		id?: string;
		showCount?: boolean;
		maxCount?: number;
	}

	let {
		label,
		description,
		error,
		id = `textarea-${Math.random().toString(36).slice(2, 9)}`,
		disabled = false,
		required = false,
		rows = 4,
		showCount = false,
		maxCount,
		class: className,
		value = $bindable(''),
		...restProps
	}: Props = $props();

	let descriptionId = $derived(`${id}-description`);
	let errorId = $derived(`${id}-error`);

	// Unicode code points count helper
	let charCount = $derived(value ? Array.from(String(value)).length : 0);
	let isOverLimit = $derived(maxCount !== undefined && charCount > maxCount);
</script>

<div class="flex w-full flex-col gap-1.5">
	{#if label || (showCount && maxCount)}
		<div class="flex items-center justify-between">
			{#if label}
				<label for={id} class="flex items-center gap-1 text-sm font-semibold text-ink">
					{label}
					{#if required}
						<span class="text-danger" aria-hidden="true">*</span>
					{/if}
				</label>
			{/if}
			{#if showCount && maxCount}
				<span
					class={cn('font-mono text-xs', isOverLimit ? 'font-semibold text-danger' : 'text-muted')}
					aria-live="polite"
				>
					{charCount}/{maxCount}
				</span>
			{/if}
		</div>
	{/if}

	<textarea
		{id}
		{disabled}
		{required}
		{rows}
		bind:value
		aria-invalid={error || isOverLimit ? 'true' : undefined}
		aria-describedby={error ? errorId : description ? descriptionId : undefined}
		class={cn(
			'w-full resize-y rounded-lg border bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink transition-colors',
			'placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none',
			error || isOverLimit
				? 'border-danger focus-visible:ring-danger'
				: 'border-control-border hover:border-accent',
			disabled && 'cursor-not-allowed bg-surface-muted opacity-60',
			className
		)}
		{...restProps}></textarea>

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
