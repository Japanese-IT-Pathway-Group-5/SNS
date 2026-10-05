<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { unicodeCodePointLength } from '$lib/validation/posts';

	interface Props extends HTMLTextareaAttributes {
		label?: string;
		description?: string;
		error?: string;
		id?: string;
		showCount?: boolean;
		maxCount?: number;
		autoResize?: boolean;
	}

	const generatedId = $props.id();
	let {
		label,
		description,
		error,
		id = generatedId,
		disabled = false,
		required = false,
		rows = 4,
		showCount = false,
		maxCount,
		autoResize = true,
		class: className,
		value = $bindable(''),
		...restProps
	}: Props = $props();

	let descriptionId = $derived(`${id}-description`);
	let errorId = $derived(`${id}-error`);

	// Unicode code points count helper
	let charCount = $derived(unicodeCodePointLength(String(value ?? '')));
	let isOverLimit = $derived(maxCount !== undefined && charCount > maxCount);

	let textareaEl = $state<HTMLTextAreaElement | null>(null);

	function adjustHeight() {
		if (autoResize && textareaEl) {
			textareaEl.style.height = 'auto';
			const styles = getComputedStyle(textareaEl);
			const borders = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
			textareaEl.style.height = `${textareaEl.scrollHeight + borders}px`;
		}
	}

	$effect(() => {
		if (autoResize && textareaEl && value !== undefined) {
			adjustHeight();
		}
	});

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) {
		adjustHeight();
		restProps.oninput?.(event);
	}

	let describedBy = $derived(
		[
			restProps['aria-describedby'],
			description && descriptionId,
			error && errorId,
			showCount && maxCount !== undefined && `${id}-count`
		]
			.filter(Boolean)
			.join(' ') || undefined
	);
</script>

<svelte:window onresize={adjustHeight} />

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
					id={`${id}-count`}
					class={cn(
						'ml-auto text-xs tabular-nums',
						isOverLimit ? 'font-semibold text-danger' : 'text-muted'
					)}
				>
					{charCount}/{maxCount}
				</span>
			{/if}
		</div>
	{/if}

	<textarea
		{...restProps}
		{id}
		{disabled}
		{required}
		{rows}
		bind:this={textareaEl}
		bind:value
		oninput={handleInput}
		aria-invalid={error || isOverLimit ? 'true' : undefined}
		aria-describedby={describedBy}
		class={cn(
			'w-full resize-none rounded-lg border bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink transition-colors',
			'placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none',
			error || isOverLimit
				? 'border-danger focus-visible:ring-danger'
				: 'border-control-border hover:border-accent',
			disabled && 'cursor-not-allowed bg-surface-muted opacity-60',
			className
		)}></textarea>

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
