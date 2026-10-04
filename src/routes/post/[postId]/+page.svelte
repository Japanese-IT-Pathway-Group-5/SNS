<script lang="ts">
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
	import { AppShell, Button, Avatar, FormMessage } from '$lib/components/ui';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const post = $derived(data.post);
</script>

<svelte:head>
	<title>{post.authorName}’s post — Claymore</title>
	<meta name="description" content="A public everyday moment shared on Claymore." />
</svelte:head>

<AppShell user={data.user}>
	<main class="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
		<a
			href={resolve('/')}
			class="mb-6 inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4"
			>Back to home</a
		>

		<article class="mt-4 border-b border-line pb-8">
			<div class="mb-4 flex items-center gap-3">
				<Avatar src={post.authorImage ?? null} name={post.authorName} size="md" />
				<div>
					<p class="font-semibold text-ink">{post.authorName}</p>
					<time class="text-sm text-muted" datetime={new Date(post.createdAt).toISOString()}>
						{new Date(post.createdAt).toLocaleString()}
					</time>
				</div>
			</div>
			<p class="text-base leading-relaxed whitespace-pre-wrap text-ink">{post.body}</p>
			{#if post.mediaId}
				<img
					src={`/api/media/${post.mediaId}`}
					alt="Post attachment"
					class="mt-4 max-h-[600px] w-full rounded-xl border border-line object-contain"
					loading="lazy"
				/>
			{/if}
		</article>

		<section class="mt-8" aria-labelledby="replies-heading">
			<h2 id="replies-heading" class="text-xl font-semibold text-ink">
				Replies ({data.replies.length})
			</h2>

			{#if data.user}
				<form
					method="POST"
					action="?/reply"
					class="mt-5 space-y-3 rounded-xl border border-line bg-surface p-4 sm:p-5"
				>
					<label for="reply-body" class="block text-sm font-semibold text-ink">Write a reply</label>
					<textarea
						id="reply-body"
						name="body"
						rows="3"
						maxlength="500"
						required
						placeholder="Add to the conversation…"
						class="w-full resize-y rounded-lg border border-control-border bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>{form?.body ?? ''}</textarea
					>
					{#if form?.message}<FormMessage type="error" message={form.message} />{/if}
					<div class="flex justify-end">
						<Button variant="primary" type="submit">Reply</Button>
					</div>
				</form>
			{:else}
				<div class="mt-5 rounded-xl border border-line bg-surface p-4 sm:p-5">
					<p class="text-sm text-muted">Sign in to reply and create your profile.</p>
					<Button variant="primary" size="sm" href="/login" class="mt-3">Sign in to reply</Button>
				</div>
			{/if}

			<div class="mt-6 divide-y divide-line">
				{#each data.replies as reply (reply.id)}
					<article class="py-5 first:pt-0">
						<div class="mb-2 flex items-center gap-2.5">
							<Avatar name={reply.authorName} size="sm" />
							<p class="font-semibold text-ink">{reply.authorName}</p>
							<time class="text-xs text-muted" datetime={new Date(reply.createdAt).toISOString()}>
								{new Date(reply.createdAt).toLocaleString()}
							</time>

							{#if data.user?.id === reply.authorId}
								<form method="POST" action="?/deleteReply" class="ml-auto">
									<input type="hidden" name="replyId" value={reply.id} />
									<Button
										variant="ghost"
										size="sm"
										type="submit"
										aria-label="Delete reply"
										title="Delete reply"
										class="text-muted hover:bg-red-50 hover:text-red-600"
									>
										<FontAwesomeIcon icon={faTrashCan} class="size-4" />
									</Button>
								</form>
							{/if}
						</div>
						<p class="leading-relaxed whitespace-pre-wrap text-ink">{reply.body}</p>
					</article>
				{:else}
					<p class="py-6 text-sm text-muted">No replies yet. Start the conversation.</p>
				{/each}
			</div>
		</section>
	</main>
</AppShell>
