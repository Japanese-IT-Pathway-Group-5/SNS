<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, Avatar, Textarea, FormMessage } from '$lib/components/ui';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let replyBody = $state('');
	let isSubmitting = $state(false);

	// Derived to handle formatting dates
	function formatDate(dateString: string | number | Date) {
		return new Date(dateString).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Post by {data.post.author.name} — SNS</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
	<!-- Navigation -->
	<div class="mb-6">
		<Button variant="ghost" size="sm" href="/" aria-label="Go back">
			<FontAwesomeIcon icon={faArrowLeft} class="size-4" />
			<span class="ml-2">Back to Journal</span>
		</Button>
	</div>

	<!-- Original Post -->
	<div class="mb-8">
		<Card class="p-6 sm:p-8">
			<div class="mb-4 flex items-center gap-3">
				<Avatar name={data.post.author.name} src={data.post.author.image} />
				<div>
					<div class="font-bold text-ink">{data.post.author.name}</div>
					<div class="text-sm text-muted">{formatDate(data.post.createdAt)}</div>
				</div>
			</div>

			<div class="text-base leading-relaxed whitespace-pre-wrap text-ink">
				{data.post.body}
			</div>

			{#if data.post.imageKey}
				<div class="mt-4 overflow-hidden rounded-xl border border-line">
					<img
						src={`/api/media/${data.post.imageKey}`}
						alt="Post attachment"
						class="max-h-[500px] w-full bg-surface-muted/30 object-contain"
					/>
				</div>
			{/if}
		</Card>
	</div>

	<!-- Replies Section -->
	<div class="space-y-6">
		<h2 class="border-b border-line pb-2 text-lg font-bold text-ink">
			Replies ({data.replies.length})
		</h2>

		<!-- Reply Form -->
		{#if data.user}
			<Card class="bg-surface-muted/30 p-4 sm:p-6">
				<form
					method="POST"
					action="?/createReply"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update, result }) => {
							await update({ reset: true });
							isSubmitting = false;
							if (result.type === 'success') {
								replyBody = '';
							}
						};
					}}
					class="space-y-4"
				>
					<div class="flex items-start gap-3">
						<Avatar name={data.user.name} src={data.user.image} size="sm" />
						<div class="flex-1 space-y-2">
							<Textarea
								name="body"
								placeholder="Write a reply..."
								bind:value={replyBody}
								maxlength={500}
								rows={3}
								disabled={isSubmitting}
								class="resize-none"
							/>
							<div class="flex items-center justify-between">
								<div class="text-xs text-muted">
									{replyBody.length} / 500
								</div>
								<Button
									type="submit"
									variant="primary"
									size="sm"
									loading={isSubmitting}
									disabled={replyBody.trim().length === 0}
								>
									Reply
								</Button>
							</div>
							{#if form?.error && !form?.success}
								<FormMessage type="error" message={form.error} />
							{/if}
						</div>
					</div>
				</form>
			</Card>
		{/if}

		<!-- Replies List -->
		<div class="space-y-4 pt-4">
			{#if data.replies.length === 0}
				<div class="py-8 text-center text-sm text-muted">No replies yet.</div>
			{:else}
				{#each data.replies as reply (reply.id)}
					<div
						class="group relative flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-surface-muted/20"
					>
						<Avatar name={reply.author.name} src={reply.author.image} size="sm" />
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-2">
								<div class="flex items-baseline gap-2">
									<span class="text-sm font-bold text-ink">{reply.author.name}</span>
									<span class="text-xs text-muted">{formatDate(reply.createdAt)}</span>
								</div>

								<!-- Delete Button (Only for author) -->
								{#if data.user && data.user.id === reply.authorId}
									<form
										method="POST"
										action="?/deleteReply"
										use:enhance
										class="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
									>
										<input type="hidden" name="replyId" value={reply.id} />
										<button
											type="submit"
											class="rounded-md p-1 text-muted transition-colors hover:text-danger"
											aria-label="Delete reply"
										>
											<FontAwesomeIcon icon={faTrash} class="size-3.5" />
										</button>
									</form>
								{/if}
							</div>
							<div class="mt-1 text-sm break-words whitespace-pre-wrap text-ink">
								{reply.body}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
