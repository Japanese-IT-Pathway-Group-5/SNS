<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ModalDialog from '$lib/components/ui/ModalDialog.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import FormMessage from '$lib/components/ui/FormMessage.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faMessage } from '@fortawesome/free-regular-svg-icons';
	import { faEyeSlash } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		id: string;
		authorName: string;
		authorAvatar?: string | null;
		createdAt: Date | string | number;
		content: string;
		imageUrl?: string | null;
		isModerator?: boolean;
		hideError?: string | null;
		hideErrorPostId?: string | null;
	}

	let {
		id,
		authorName,
		authorAvatar,
		createdAt,
		content,
		imageUrl,
		isModerator = false,
		hideError = null,
		hideErrorPostId = null
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
	let hideOpen = $state(false);
	let hideReason = $state('');
	let myHideError = $derived(hideErrorPostId === id ? hideError : null);
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
	<div class="flex items-center gap-2">
		<Button
			variant="ghost"
			size="sm"
			href={`/post/${id}`}
			class="group text-muted hover:bg-surface-muted hover:text-accent"
		>
			<FontAwesomeIcon icon={faMessage} class="size-4 transition-transform group-active:scale-95" />
			<span class="font-medium">Reply</span>
		</Button>

		{#if isModerator}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => {
					hideOpen = true;
				}}
				class="group text-muted hover:bg-surface-muted hover:text-danger"
			>
				<FontAwesomeIcon
					icon={faEyeSlash}
					class="size-4 transition-transform group-active:scale-95"
				/>
				<span class="font-medium">Hide</span>
			</Button>
		{/if}
	</div>

	{#if myHideError}
		<FormMessage type="error" message={myHideError} />
	{/if}

	{#if isModerator}
		<ModalDialog
			bind:open={hideOpen}
			title="Hide post"
			description="This post will be hidden from all readers."
		>
			<form
				method="POST"
				action="?/hidePost"
				use:enhance={() => {
					return async ({ update, result }) => {
						if (result.type === 'redirect') {
							hideOpen = false;
							hideReason = '';
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="postId" value={id} />
				<Textarea
					label="Reason"
					name="reason"
					required
					placeholder="Why should this post be hidden?"
					maxCount={500}
					showCount
					rows={3}
					bind:value={hideReason}
				/>
				<div class="mt-4 flex items-center justify-end gap-2">
					<Button
						variant="secondary"
						size="sm"
						onclick={() => {
							hideOpen = false;
						}}>Cancel</Button
					>
					<Button variant="danger" size="sm" type="submit">Hide post</Button>
				</div>
			</form>
		</ModalDialog>
	{/if}
</article>
