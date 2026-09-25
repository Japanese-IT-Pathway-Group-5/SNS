<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		children?: Snippet;
		actions?: Snippet;
		trigger?: Snippet;
		class?: string;
	}

	let {
		open = $bindable(false),
		title,
		description,
		children,
		actions,
		trigger,
		class: className
	}: Props = $props();
</script>

<Dialog.Root bind:open>
	{#if trigger}
		<Dialog.Trigger>
			{@render trigger()}
		</Dialog.Trigger>
	{/if}

	<Dialog.Portal>
		<Dialog.Overlay
			class="animate-in fade-in fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs transition-opacity duration-150"
		/>
		<Dialog.Content
			class={cn(
				'fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]',
				'rounded-xl border border-line bg-surface p-6 shadow-md',
				'flex flex-col gap-4 focus-visible:outline-none',
				className
			)}
		>
			<div class="flex items-start justify-between gap-3">
				<div class="flex flex-col gap-1">
					{#if title}
						<Dialog.Title class="text-lg leading-tight font-bold text-ink">
							{title}
						</Dialog.Title>
					{/if}
					{#if description}
						<Dialog.Description class="text-sm text-muted">
							{description}
						</Dialog.Description>
					{/if}
				</div>

				<Dialog.Close
					class="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
					aria-label="Close dialog"
				>
					<FontAwesomeIcon icon={faXmark} class="size-4" />
				</Dialog.Close>
			</div>

			{#if children}
				<div class="py-1 text-sm leading-relaxed text-ink">
					{@render children()}
				</div>
			{/if}

			{#if actions}
				<div class="flex items-center justify-end gap-2 border-t border-line/60 pt-2">
					{@render actions()}
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
