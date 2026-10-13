<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
	import {
		AppShell,
		Button,
		BackButton,
		FormMessage,
		LoadingImage,
		Textarea
	} from '$lib/components/ui';
	import AuthorLink from '$lib/components/profile/AuthorLink.svelte';
	import { MAX_REPLY_LENGTH, unicodeCodePointLength } from '$lib/validation/posts';
	import type { ActionData, PageData } from './$types';
	import PostActions from '$lib/components/posts/PostActions.svelte';
	import { getUiPreferences, t } from '$lib/preferences/ui';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const ui = getUiPreferences();
	const post = $derived(data.post);
	let writing = $state(false);
	let replyBody = $state('');
	$effect(() => {
		if (page.url.searchParams.get('reply') === '1' || (form && 'body' in form)) writing = true;
		if (form && 'body' in form) replyBody = form.body ?? '';
	});
	async function startWriting() {
		writing = true;
		await tick();
		document.getElementById('reply-body')?.focus();
	}
</script>

<svelte:head>
	<title>{post.authorName}’s post — Claymore</title>
	<meta name="description" content="A public everyday moment shared on Claymore." />
</svelte:head>

<AppShell user={data.user}>
	<main class="w-full min-w-0">
		<BackButton href={resolve('/')} label={t(ui, 'common.backHome')} class="mb-6" />

		<article class="mt-4 border-b border-line pb-8">
			<div class="mb-4 flex items-center gap-3">
				<div>
					<AuthorLink id={post.authorId} name={post.authorName} image={post.authorImage} />
					<time class="text-sm text-muted" datetime={new Date(post.createdAt).toISOString()}>
						{new Date(post.createdAt).toLocaleString(ui.language === 'ja' ? 'ja-JP' : 'en')}
					</time>
				</div>
			</div>
			<p class="text-base leading-relaxed whitespace-pre-wrap text-ink">{post.body}</p>
			{#if post.mediaId}
				<div class="mt-4 w-full max-w-full">
					<LoadingImage
						containerClass="border border-line"
						src={`/api/media/${post.mediaId}`}
						alt={t(ui, 'common.attachment')}
						class="block h-auto max-h-[600px] w-auto max-w-full"
						loading="lazy"
					/>
				</div>
			{/if}
			<PostActions postId={post.id} user={data.user} initiallyLiked={post.isLiked} />
		</article>

		<section class="mt-8" aria-labelledby="replies-heading">
			<h2 id="replies-heading" class="text-base font-semibold text-ink">
				{t(ui, 'reply.heading')} ({data.replies.length})
			</h2>

			{#if data.user}
				{#if !writing}
					<Button variant="secondary" size="sm" class="mt-4" onclick={startWriting}
						>{t(ui, 'reply.write')}</Button
					>
				{:else}
					<form
						method="POST"
						action="?/reply"
						class="mt-5 space-y-3 rounded-xl border border-line bg-surface p-4 sm:p-5"
					>
						<Textarea
							id="reply-body"
							label={t(ui, 'reply.write')}
							name="body"
							bind:value={replyBody}
							rows={3}
							required
							maxCount={MAX_REPLY_LENGTH}
							showCount
							placeholder={t(ui, 'reply.placeholder')}
							class="resize-y bg-surface px-3.5 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						/>
						{#if form?.message}<FormMessage type="error" message={form.message} />{/if}
						<div class="flex justify-end gap-2">
							<Button variant="ghost" type="button" onclick={() => (writing = false)}
								>{t(ui, 'reply.cancel')}</Button
							>
							<Button
								variant="primary"
								type="submit"
								disabled={unicodeCodePointLength(replyBody) > MAX_REPLY_LENGTH}
								>{t(ui, 'reply.submit')}</Button
							>
						</div>
					</form>
				{/if}
			{:else}
				<div class="mt-5 rounded-xl border border-line bg-surface p-4 sm:p-5">
					<p class="text-sm text-muted">{t(ui, 'reply.signIn')}</p>
					<Button variant="primary" size="sm" href="/login" class="mt-3"
						>{t(ui, 'reply.signIn')}</Button
					>
				</div>
			{/if}

			<div class="mt-6 divide-y divide-line">
				{#each data.replies as reply (reply.id)}
					<article class="py-5 first:pt-0">
						<div class="mb-2 flex items-center gap-2.5">
							<AuthorLink
								id={reply.authorId}
								name={reply.authorName}
								image={reply.authorImage}
								size="sm"
							/>
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
										aria-label={t(ui, 'reply.delete')}
										title={t(ui, 'reply.delete')}
										class="text-muted hover:bg-danger hover:text-on-danger"
									>
										<FontAwesomeIcon icon={faTrashCan} class="size-4" />
									</Button>
								</form>
							{/if}
						</div>
						<p class="leading-relaxed whitespace-pre-wrap text-ink">{reply.body}</p>
					</article>
				{:else}
					<p class="py-6 text-sm text-muted">{t(ui, 'reply.empty')}</p>
				{/each}
			</div>
		</section>
	</main>
</AppShell>
