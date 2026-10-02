<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faMessage } from '@fortawesome/free-regular-svg-icons';

	interface Props {
		id: string;
		authorName: string;
		authorAvatar?: string | null;
		createdAt: Date | string | number;
		content: string;
		imageUrl?: string | null;
		replyCount?: number;
	}

	let {
		id,
		authorName,
		authorAvatar,
		createdAt,
		content,
		imageUrl,
		replyCount = 0
	}: Props = $props();

	function getRelativeTime(dateInput: Date | string | number) {
		const date = new Date(dateInput);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d`;
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	let timeAgo = $derived(getRelativeTime(createdAt));
</script>

<Card class="flex flex-col gap-3 transition-colors hover:border-control-border">
	<!-- Header: Author & Time -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Avatar src={authorAvatar} name={authorName} size="md" />
			<span class="font-medium text-ink">{authorName}</span>
		</div>
		<span class="text-sm text-muted">{timeAgo}</span>
	</div>

	<!-- Content -->
	<div class="text-base leading-relaxed whitespace-pre-wrap text-ink">{content}</div>

	<!-- Optional Image -->
	{#if imageUrl}
		<div class="mt-1 overflow-hidden rounded-xl border border-line bg-surface-muted">
			<img
				src={imageUrl}
				alt="Post attachment"
				class="max-h-[500px] w-full object-cover"
				loading="lazy"
			/>
		</div>
	{/if}

	<!-- Actions -->
	<div class="mt-1 flex items-center border-t border-line/50 pt-2">
		<Button
			variant="ghost"
			size="sm"
			href={`/post/${id}`}
			class="group text-muted hover:bg-surface-muted hover:text-accent"
		>
			<FontAwesomeIcon icon={faMessage} class="size-4 transition-transform group-active:scale-95" />
			<span class="font-medium">{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
		</Button>
	</div>
</Card>
