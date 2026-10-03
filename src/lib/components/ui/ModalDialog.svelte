<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		children?: Snippet;
		actions?: Snippet;
		trigger?: Snippet;
		headerArtwork?: Snippet;
		headerClass?: string;
		class?: string;
	}

	let {
		open = $bindable(false),
		title,
		description,
		children,
		actions,
		trigger,
		headerArtwork,
		headerClass,
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
			<div class={cn('relative flex items-start justify-between gap-3', headerClass)}>
				{#if headerArtwork}{@render headerArtwork()}{/if}
				<div class="relative z-10 flex min-w-0 flex-col gap-2">
					{#if title}
						<Dialog.Title
							class={headerClass
								? 'text-2xl leading-tight font-semibold tracking-tight'
								: 'text-lg leading-tight font-bold text-ink'}
						>
							{title}
						</Dialog.Title>
					{/if}
					{#if description}
						<Dialog.Description
							class={headerClass ? 'text-sm leading-6 opacity-85' : 'text-sm text-muted'}
						>
							{description}
						</Dialog.Description>
					{/if}
				</div>

				<Dialog.Close
					class="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-lg text-current transition-colors hover:outline-2 hover:outline-offset-2 hover:outline-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
					aria-label="Close dialog"
				>
					<X class="size-5" strokeWidth={1.75} aria-hidden="true" />
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
