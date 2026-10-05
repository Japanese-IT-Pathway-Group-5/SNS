<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { enhance, applyAction } from '$app/forms';
	import type { User } from 'better-auth';
	import { Avatar, Button, Textarea, FormMessage } from '$lib/components/ui';
	import { unicodeCodePointLength } from '$lib/validation/posts';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	interface Reply {
		id: string;
		authorName: string;
		authorImage?: string | null;
		body: string;
		createdAt: string;
	}
	let {
		postId,
		user = null,
		onAdded = () => {}
	}: { postId: string; user?: User | null; onAdded?: () => void } = $props();
	let replies = $state<Reply[]>([]);
	let nextCursor = $state<{ createdAt: number; id: string } | null>(null);
	let loaded = $state(false);
	let loading = $state(false);
	let loadError = $state('');
	let writing = $state(false);
	let body = $state('');
	let saving = $state(false);
	let saveError = $state('');
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
		const params = new URLSearchParams({ postId });
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
				loadError = "Replies couldn't load. Please try again.";
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
	aria-label="Replies to this entry"
	class="border-t border-line pt-4"
>
	{#if loading && !loaded}
		<div role="status" aria-label="Loading replies" class="space-y-4">
			<span class="sr-only">Loading replies…</span>
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
					<Avatar name={reply.authorName} src={reply.authorImage} size="sm" />
					<div class="min-w-0 flex-1 rounded-lg bg-canvas px-3 py-2.5">
						<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
							<p class="text-sm font-semibold break-words text-ink">{reply.authorName}</p>
							<time class="text-xs text-muted" datetime={new Date(reply.createdAt).toISOString()}
								>{new Date(reply.createdAt).toLocaleDateString(undefined, {
									month: 'short',
									day: 'numeric'
								})}</time
							>
						</div>
						<p class="mt-1 text-sm leading-6 break-words whitespace-pre-wrap text-ink">
							{reply.body}
						</p>
					</div>
				</article>
			{:else}<p class="text-sm text-muted">No replies yet.</p>{/each}
		</div>
	{/if}
	{#if loadError}<div class="mt-3">
			<FormMessage type="error" message={loadError} /><Button
				size="sm"
				variant="ghost"
				onclick={() => loadReplies(!loaded)}
				disabled={loading}>Try again</Button
			>
		</div>{/if}
	{#if nextCursor}<Button
			variant="link"
			size="sm"
			class="mt-3"
			{loading}
			onclick={() => loadReplies()}>Show older replies</Button
		>{/if}
	{#if notice}<p role="status" class="mt-3 text-sm text-accent">{notice}</p>{/if}

	{#if !writing}
		<div class="mt-4">
			{#if user}<Button variant="secondary" size="sm" onclick={startWriting}>Write a reply</Button>
			{:else}<Button
					variant="link"
					size="sm"
					href={resolve(
						`/login?redirectTo=${encodeURIComponent(`${postUrl}?reply=1#replies-heading`)}`
					)}>Sign in to reply</Button
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
							notice = 'Reply added.';
							if (loading) {
								controller?.abort();
								loading = false;
							}
							await loadReplies(true);
						} else if (result.type === 'redirect') await applyAction(result);
						else if (result.type === 'failure')
							saveError = String(
								result.data?.message ?? 'Could not post your reply. Please try again.'
							);
						else saveError = 'Could not post your reply. Please try again.';
					} finally {
						saving = false;
					}
				};
			}}
		>
			<Textarea
				id={bodyId}
				label="Write a reply"
				name="body"
				bind:value={body}
				rows={2}
				required
				maxCount={500}
				showCount
				disabled={saving}
				placeholder="A few words in response..."
			/>
			{#if saveError}<FormMessage type="error" message={saveError} />{/if}
			<div class="flex justify-end gap-2">
				<Button variant="ghost" size="sm" disabled={saving} onclick={() => (writing = false)}
					>Cancel</Button
				>
				<Button
					type="submit"
					size="sm"
					loading={saving}
					disabled={saving || !body.trim() || unicodeCodePointLength(body) > 500}>Post reply</Button
				>
			</div>
		</form>
	{/if}
</section>
