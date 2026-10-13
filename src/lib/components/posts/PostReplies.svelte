<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { enhance, applyAction } from '$app/forms';
	import type { User } from 'better-auth';
	import { Button, Textarea, FormMessage } from '$lib/components/ui';
	import { unicodeCodePointLength } from '$lib/validation/posts';
	import AuthorLink from '$lib/components/profile/AuthorLink.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
	import { getUiPreferences, t } from '$lib/preferences/ui';

	interface Reply {
		id: string;
		authorName: string;
		authorId: string;
		authorImage?: string | null;
		body: string;
		createdAt: string;
	}
	let {
		postId,
		user = null,
		onAdded = () => {},
		onDeleted = () => {}
	}: {
		postId: string;
		user?: User | null;
		onAdded?: () => void;
		onDeleted?: () => void;
	} = $props();
	const ui = getUiPreferences();
	let replies = $state<Reply[]>([]);
	let nextCursor = $state<{ createdAt: number; id: string } | null>(null);
	let loaded = $state(false);
	let loading = $state(false);
	let loadError = $state('');
	let writing = $state(false);
	let body = $state('');
	let saving = $state(false);
	let saveError = $state('');
	let deleteError = $state('');
	let deletingReplyId = $state<string | null>(null);
	let notice = $state('');
	let controller: AbortController | undefined;
	let requestVersion = 0;
	const postUrl = $derived(resolve('/post/[postId]', { postId }));
	const bodyId = $derived(`reply-body-${postId}`);

	async function loadReplies(reset = false) {
		if (loading) return;
		loading = true;
		loadError = '';
		controller = new AbortController();
		const version = ++requestVersion;
		const params = new SvelteURLSearchParams({ postId });
		if (!reset && nextCursor) {
			params.set('cursorCreatedAt', String(nextCursor.createdAt));
			params.set('cursorId', nextCursor.id);
		}
		try {
			const response = await fetch(`${resolve('/api/replies')}?${params}`, {
				signal: controller.signal
			});
			if (!response.ok) throw new Error('Replies unavailable');
			const page = (await response.json()) as { items: Reply[]; nextCursor: typeof nextCursor };
			if (version !== requestVersion) return;
			const existing = reset ? [] : replies;
			const ids = new Set(existing.map((reply) => reply.id));
			replies = [...existing, ...page.items.filter((reply) => !ids.has(reply.id))];
			nextCursor = page.nextCursor;
			loaded = true;
		} catch (err) {
			if (version === requestVersion && !(err instanceof DOMException && err.name === 'AbortError'))
				loadError = t(ui, 'reply.loadError');
		} finally {
			if (version === requestVersion) loading = false;
		}
	}
	onMount(() => {
		void loadReplies();
	});
	onDestroy(() => controller?.abort());
	async function startWriting() {
		writing = true;
		await tick();
		document.getElementById(bodyId)?.focus();
	}
</script>

<section
	id={`replies-${postId}`}
	aria-label={t(ui, 'reply.heading')}
	class="border-t border-line pt-4"
>
	{#if loading && !loaded}
		<div role="status" aria-label={t(ui, 'reply.loading')} class="space-y-4">
			<span class="sr-only">{t(ui, 'reply.loading')}</span>
			{#each [1, 2] as row (row)}<div class="flex gap-2.5">
					<Skeleton class="size-8 shrink-0 rounded-full" />
					<div class="flex-1 space-y-3 rounded-lg bg-canvas p-3">
						<Skeleton class="h-3 w-24" /><Skeleton class="h-3 w-4/5" />
					</div>
				</div>{/each}
		</div>
	{/if}
	{#if loaded}
		<div class="space-y-4">
			{#each replies as reply (reply.id)}
				<article class="flex min-w-0 items-start gap-2.5">
					<div class="min-w-0 flex-1 rounded-lg bg-canvas px-3 py-2.5">
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<AuthorLink
								id={reply.authorId}
								name={reply.authorName}
								image={reply.authorImage}
								size="sm"
							/>
							<time class="text-xs text-muted" datetime={new Date(reply.createdAt).toISOString()}
								>{new Date(reply.createdAt).toLocaleDateString(
									ui.language === 'ja' ? 'ja-JP' : 'en',
									{
										month: 'short',
										day: 'numeric'
									}
								)}</time
							>
							{#if user?.id === reply.authorId}
								<form
									method="POST"
									action={`${postUrl}?/deleteReply`}
									class="ml-auto"
									use:enhance={() => {
										deletingReplyId = reply.id;
										deleteError = '';
										notice = '';
										return async ({ result }) => {
											try {
												if (result.type === 'redirect' && result.location === postUrl) {
													replies = replies.filter((item) => item.id !== reply.id);
													onDeleted();
													notice = t(ui, 'reply.deleted');
												} else if (result.type === 'redirect') await applyAction(result);
												else if (result.type === 'failure')
													deleteError = String(result.data?.message ?? t(ui, 'reply.deleteError'));
												else deleteError = t(ui, 'reply.deleteError');
											} finally {
												deletingReplyId = null;
											}
										};
									}}
								>
									<input type="hidden" name="replyId" value={reply.id} />
									<Button
										variant="ghost"
										size="md"
										type="submit"
										loading={deletingReplyId === reply.id}
										disabled={deletingReplyId !== null}
										aria-label={t(ui, 'reply.delete')}
										title={t(ui, 'reply.delete')}
										class="text-muted hover:bg-danger hover:text-on-danger"
									>
										{#if deletingReplyId !== reply.id}
											<FontAwesomeIcon icon={faTrashCan} class="size-4" />
										{/if}
									</Button>
								</form>
							{/if}
						</div>
						<p class="mt-1 text-sm leading-6 break-words whitespace-pre-wrap text-ink">
							{reply.body}
						</p>
					</div>
				</article>
			{:else}<p class="text-sm text-muted">{t(ui, 'reply.empty')}</p>{/each}
		</div>
	{/if}
	{#if loadError}<div class="mt-3">
			<FormMessage type="error" message={loadError} /><Button
				size="sm"
				variant="ghost"
				onclick={() => loadReplies(!loaded)}
				disabled={loading}>{t(ui, 'common.tryAgain')}</Button
			>
		</div>{/if}
	{#if nextCursor}<Button
			variant="link"
			size="sm"
			class="mt-3"
			{loading}
			onclick={() => loadReplies()}>{t(ui, 'reply.older')}</Button
		>{/if}
	{#if notice}<p role="status" class="mt-3 text-sm text-accent">{notice}</p>{/if}
	{#if deleteError}<div class="mt-3"><FormMessage type="error" message={deleteError} /></div>{/if}

	{#if !writing}
		<div class="mt-4">
			{#if user}<Button variant="secondary" size="sm" onclick={startWriting}
					>{t(ui, 'reply.write')}</Button
				>
			{:else}<Button
					variant="link"
					size="sm"
					href={resolve(
						`/login?redirectTo=${encodeURIComponent(`${postUrl}?reply=1#replies-heading`)}`
					)}>{t(ui, 'reply.signIn')}</Button
				>{/if}
		</div>
	{:else}
		<form
			method="POST"
			action={`${postUrl}?/reply`}
			class="mt-4 space-y-3"
			use:enhance={() => {
				saving = true;
				saveError = '';
				notice = '';
				return async ({ result }) => {
					try {
						if (result.type === 'redirect' && result.location === postUrl) {
							body = '';
							writing = false;
							onAdded();
							notice = t(ui, 'reply.added');
							if (loading) {
								controller?.abort();
								loading = false;
							}
							await loadReplies(true);
						} else if (result.type === 'redirect') await applyAction(result);
						else if (result.type === 'failure')
							saveError = String(result.data?.message ?? t(ui, 'reply.saveError'));
						else saveError = t(ui, 'reply.saveError');
					} finally {
						saving = false;
					}
				};
			}}
		>
			<Textarea
				id={bodyId}
				label={t(ui, 'reply.write')}
				name="body"
				bind:value={body}
				rows={2}
				required
				maxCount={500}
				showCount
				disabled={saving}
				placeholder={t(ui, 'reply.placeholder')}
			/>
			{#if saveError}<FormMessage type="error" message={saveError} />{/if}
			<div class="flex justify-end gap-2">
				<Button variant="ghost" size="sm" disabled={saving} onclick={() => (writing = false)}
					>{t(ui, 'reply.cancel')}</Button
				>
				<Button
					type="submit"
					size="sm"
					loading={saving}
					disabled={saving || !body.trim() || unicodeCodePointLength(body) > 500}
					>{t(ui, 'reply.submit')}</Button
				>
			</div>
		</form>
	{/if}
</section>
