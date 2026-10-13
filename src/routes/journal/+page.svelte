<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		AppShell,
		Avatar,
		Button,
		BackButton,
		EmptyState,
		FormMessage
	} from '$lib/components/ui';
	import { PostCard } from '$lib/components/posts';
	import { groupByDate } from '$lib/journal/group-by-date';
	import Palette from '@lucide/svelte/icons/palette';
	import BannerArtwork from '$lib/components/profile/BannerArtwork.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
	import type { PageData } from './$types';
	import { getUiPreferences, t } from '$lib/preferences/ui';

	let { data }: { data: PageData } = $props();
	const ui = getUiPreferences();
	let createOpen = $state(false);
	// The server renders in UTC; switch to the reader's own time zone once in the browser.
	let timeZone = $state<string | undefined>('UTC');
	onMount(() => {
		timeZone = undefined;
	});

	// svelte-ignore state_referenced_locally
	let feedPosts = $state(data.posts);
	// svelte-ignore state_referenced_locally
	let nextCursor = $state(data.nextCursor);
	let isLoadingMore = $state(false);
	let loadMoreError = $state<string | null>(null);
	let sentinelEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		feedPosts = data.posts;
		nextCursor = data.nextCursor;
		loadMoreError = null;
	});

	const viewingOlder = $derived(page.url.searchParams.has('cursor'));
	const groups = $derived(
		groupByDate(feedPosts, { timeZone, locale: ui.language === 'ja' ? 'ja-JP' : 'en' })
	);

	async function loadMore() {
		if (isLoadingMore || !nextCursor) return;
		isLoadingMore = true;
		loadMoreError = null;
		try {
			const res = await fetch(
				`${resolve('/api/posts')}?journal=1&cursor=${encodeURIComponent(nextCursor)}`
			);
			if (!res.ok) throw new Error('Failed to load more posts');
			const result = (await res.json()) as { items: typeof data.posts; nextCursor: string | null };

			const existingIds = new Set(feedPosts.map((p) => p.id));
			const newItems = result.items.filter((p) => !existingIds.has(p.id));
			feedPosts = [...feedPosts, ...newItems];
			nextCursor = result.nextCursor;
		} catch {
			loadMoreError = t(ui, 'common.olderLoadError');
		} finally {
			isLoadingMore = false;
		}
	}

	$effect(() => {
		if (!sentinelEl || !nextCursor) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting && !isLoadingMore && nextCursor) {
					loadMore();
				}
			},
			{ rootMargin: '300px' }
		);

		observer.observe(sentinelEl);
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>{t(ui, 'journal.title')} — Claymore</title>
</svelte:head>

<AppShell user={data.user} bind:createOpen>
	<main id="journal" class="w-full min-w-0">
		{#if data.user}
			<header class="mb-6 sm:mb-8">
				<div class="h-32 overflow-hidden rounded-xl border border-line sm:h-40">
					{#if data.banner}
						<div class="h-full overflow-hidden rounded-xl">
							<BannerArtwork value={data.banner} />
						</div>
					{:else}<div
							role="img"
							aria-label={t(ui, 'journal.bannerPlaceholder')}
							class="flex h-full items-center justify-center gap-2 rounded-xl bg-accent-soft px-4 text-accent"
						>
							<Palette class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
							<span class="text-xs">{t(ui, 'journal.canvas')}</span>
						</div>{/if}
				</div>
				<div
					class="relative -mt-8 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3 px-3 sm:-mt-10 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-4 sm:px-4"
				>
					<Avatar
						name={data.user.name}
						src={data.user.image}
						size="lg"
						class="size-20 bg-surface text-xl ring-4 ring-canvas sm:size-24 sm:text-2xl"
					/>
					<div class="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:pt-12">
						<h1 class="text-2xl font-semibold tracking-tight break-words text-ink sm:text-3xl">
							{data.user.name}
						</h1>
						<div class="mt-1 min-h-6">
							{#if data.profileError}
								<p class="text-sm leading-6 text-muted">
									{t(ui, 'profile.loadError')}
								</p>
							{:else if data.description}
								<p
									class="text-sm leading-6 break-words whitespace-pre-wrap text-muted sm:text-base"
								>
									{data.description}
								</p>
							{/if}
						</div>
					</div>
					<div class="col-start-2 row-start-1 flex justify-end pt-10 sm:col-start-3 sm:pt-12">
						<Button variant="secondary" size="sm" href={resolve('/profile/edit')}>
							<span aria-hidden="true"
								><FontAwesomeIcon icon={faPenToSquare} class="size-3.5" /></span
							>{t(ui, 'journal.editProfile')}
						</Button>
					</div>
				</div>
			</header>
		{/if}

		<section aria-labelledby="journal-heading">
			<div class="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
				<h2 id="journal-heading" class="text-base font-semibold text-ink">
					{viewingOlder ? t(ui, 'journal.earlier') : t(ui, 'journal.entries')}
				</h2>
				{#if viewingOlder}
					<BackButton href={resolve('/journal')} label={t(ui, 'common.backNewest')} />
				{:else}
					<span class="text-xs text-muted">{t(ui, 'journal.newest')}</span>
				{/if}
			</div>

			{#if data.loadError}
				<div class="py-8">
					<FormMessage type="error" message={t(ui, 'journal.loadError')} />
					<Button variant="ghost" href={page.url.pathname + page.url.search} class="mt-4"
						>{t(ui, 'common.tryAgain')}</Button
					>
				</div>
			{:else if groups.length > 0}
				{#each groups as group (group.key)}
					<section aria-labelledby={`day-${group.key}`} class="pt-6 first:pt-4">
						<h3
							id={`day-${group.key}`}
							class="text-xs font-semibold tracking-wide text-muted uppercase"
						>
							<time datetime={group.key}>{group.label}</time>
						</h3>
						<div class="mt-3 space-y-4">
							{#each group.entries as post (post.id)}
								<PostCard
									id={post.id}
									authorId={post.authorId}
									authorName={post.authorName}
									authorAvatar={post.authorImage ?? null}
									createdAt={post.createdAt}
									content={post.body}
									replyCount={post.replyCount}
									isLiked={post.isLiked}
									user={data.user}
									imageUrl={post.mediaId ? `/api/media/${post.mediaId}` : null}
								/>
							{/each}
						</div>
					</section>
				{/each}
				<div class="mt-2 border-t border-line pt-6 text-center">
					{#if nextCursor}
						<div bind:this={sentinelEl} class="space-y-3">
							{#if loadMoreError}
								<p class="text-sm text-danger">{loadMoreError}</p>
								<Button variant="secondary" onclick={loadMore}>{t(ui, 'common.tryAgain')}</Button>
							{:else if isLoadingMore}
								<div class="flex items-center justify-center gap-2 py-3 text-sm text-muted">
									<span
										class="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
									></span>
									<span>{t(ui, 'common.loadingOlder')}</span>
								</div>
							{:else}
								<Button
									variant="secondary"
									onclick={(e) => {
										e.preventDefault();
										loadMore();
									}}
									href={`${resolve('/journal')}?cursor=${encodeURIComponent(nextCursor)}#journal-heading`}
									loading={isLoadingMore}
								>
									{t(ui, 'common.olderEntries')}
								</Button>
							{/if}
						</div>
					{:else}
						<p class="text-sm font-medium text-muted">{t(ui, 'journal.firstEntry')}</p>
					{/if}
				</div>
			{:else}
				<div class="py-8 sm:py-12">
					<EmptyState
						title={viewingOlder ? t(ui, 'common.noEarlier') : t(ui, 'journal.emptyTitle')}
						description={viewingOlder
							? t(ui, 'common.beginning')
							: t(ui, 'journal.emptyDescription')}
					>
						{#snippet action()}
							{#if viewingOlder}
								<BackButton href={resolve('/journal')} label={t(ui, 'common.backNewest')} />
							{:else}
								<Button
									variant="primary"
									onclick={() => {
										createOpen = true;
									}}>{t(ui, 'journal.firstMoment')}</Button
								>
							{/if}
						{/snippet}
					</EmptyState>
				</div>
			{/if}
		</section>
	</main>
</AppShell>
