<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import type { User } from 'better-auth';
	import PostReplies from './PostReplies.svelte';
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
		user?: User | null;
	}

	let { id, authorName, authorAvatar, createdAt, content, imageUrl, replyCount = 0, user = null }: Props = $props();
	let count = $state(untrack(() => replyCount));
	let expanded = $state(false);
	let opened = $state(false);
	$effect(() => { count = replyCount; });

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

<article class="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
	<!-- Header: Author & Time -->
	<div class="flex items-start justify-between gap-4">
		<div class="flex min-w-0 items-center gap-3">
			<Avatar src={authorAvatar} name={authorName} size="md" />
			<span class="min-w-0 font-semibold break-words text-ink">{authorName}</span>
		</div>
		<a href={resolve('/post/[postId]', { postId: id })} class="shrink-0 rounded text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label="Open this journal entry"><time
			class="shrink-0 pt-2 text-xs text-muted"
			datetime={new Date(createdAt).toISOString()}
			title={new Date(createdAt).toLocaleString()}>{timeAgo}</time
		></a>
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
	<div class="flex items-center border-t border-line pt-2">
		<Button
			variant="ghost"
			size="sm"
			onclick={() => { opened = true; expanded = !expanded; }}
			aria-expanded={expanded}
			aria-controls={`replies-${id}`}
			class="group text-muted hover:bg-surface-muted hover:text-accent"
		>
			<span aria-hidden="true"><FontAwesomeIcon icon={faMessage} class="size-4 transition-transform group-active:scale-95" /></span>
			<span class="font-medium">{count} {count === 1 ? 'reply' : 'replies'}</span>
		</Button>
	</div>
	{#if opened}<div hidden={!expanded}><PostReplies postId={id} {user} onAdded={() => count += 1} /></div>{/if}
</article>
