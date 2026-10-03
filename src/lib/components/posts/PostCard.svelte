<script lang="ts">
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
	}

	let { id, authorName, authorAvatar, createdAt, content, imageUrl }: Props = $props();

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

<article class="flex min-w-0 flex-col gap-4 py-6 sm:py-7">
	<!-- Header: Author & Time -->
	<div class="flex items-start justify-between gap-4">
		<div class="flex min-w-0 items-center gap-3">
			<Avatar src={authorAvatar} name={authorName} size="md" />
			<span class="min-w-0 font-semibold break-words text-ink">{authorName}</span>
		</div>
		<time
			class="shrink-0 pt-2 text-xs text-muted"
			datetime={new Date(createdAt).toISOString()}
			title={new Date(createdAt).toLocaleString()}>{timeAgo}</time
		>
	</div>

	<!-- Content -->
	<div class="text-base leading-7 break-words whitespace-pre-wrap text-ink">{content}</div>

	<!-- Optional Image -->
	{#if imageUrl}
		<div class="mt-1 overflow-hidden rounded-xl border border-line bg-surface-muted">
			<img
				src={imageUrl}
				alt="Post attachment"
				class="max-h-[500px] w-full object-contain"
				loading="lazy"
			/>
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex items-center">
		<Button
			variant="ghost"
			size="sm"
			href={`/post/${id}`}
			class="group text-muted hover:bg-surface-muted hover:text-accent"
		>
			<FontAwesomeIcon icon={faMessage} class="size-4 transition-transform group-active:scale-95" />
			<span class="font-medium">Reply</span>
		</Button>
	</div>
</article>
