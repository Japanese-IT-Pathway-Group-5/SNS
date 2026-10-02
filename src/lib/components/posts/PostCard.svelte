<script lang="ts">
	import { Avatar } from '$lib/components/ui';

	let {
		post
	}: {
		post: {
			body: string;
			imageKey: string | null;
			createdAt: Date | string;
			author: {
				name: string;
				image: string | null;
			};
		};
	} = $props();

	// Format timestamp
	let timestamp = $derived(
		new Date(post.createdAt).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})
	);
</script>

<div class="flex items-start gap-4 sm:gap-5">
	<div class="shrink-0 pt-1">
		<Avatar name={post.author.name} src={post.author.image} size="md" />
	</div>
	<div class="min-w-0 flex-1 space-y-2">
		<div class="flex items-center gap-2">
			<p class="truncate font-bold text-ink">{post.author.name}</p>
			<span class="text-muted/60">•</span>
			<p class="shrink-0 text-sm text-muted" title={new Date(post.createdAt).toLocaleString()}>
				{timestamp}
			</p>
		</div>

		{#if post.body}
			<p class="text-sm leading-relaxed break-words whitespace-pre-wrap text-ink">
				{post.body}
			</p>
		{/if}

		{#if post.imageKey}
			<div class="mt-3 overflow-hidden rounded-xl border border-line bg-surface-muted/30">
				<img
					src={`/api/media/${post.imageKey}`}
					alt="Post attachment"
					class="max-h-[400px] w-full object-contain object-left"
					loading="lazy"
				/>
			</div>
		{/if}
	</div>
</div>
