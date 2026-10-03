<script lang="ts">
	import { resolve } from '$app/paths';
	import { page, navigating } from '$app/state';
	import { AppShell, Avatar, Button, EmptyState, FormMessage } from '$lib/components/ui';
	import { PostCard } from '$lib/components/posts';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let createOpen = $state(false);
	const viewingOlder = $derived(page.url.searchParams.has('cursor'));
	const searchUrl = $derived(
		data.search ? `${resolve('/')}?q=${encodeURIComponent(data.search)}` : resolve('/')
	);
</script>

<svelte:head>
	<title>Claymore — Everyday Journal</title>
	<meta
		name="description"
		content="Little moments, shared. Read everyday stories and share a moment of your own on Claymore."
	/>
</svelte:head>

<AppShell user={data.user} bind:createOpen>
	<div
		class="mx-auto grid max-w-2xl items-start gap-8 px-4 pt-7 pb-12 sm:px-6 sm:pt-9 sm:pb-16 xl:max-w-6xl xl:grid-cols-[minmax(0,1fr)_18rem]"
	>
		<main id="feed" class="w-full max-w-2xl min-w-0 justify-self-center">
			<div class="mb-6 sm:mb-8">
				<h1 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
					{data.search ? 'Find a little moment.' : 'Little moments, shared.'}
				</h1>
				<p class="mt-2 text-sm leading-6 text-muted sm:text-base">
					{data.search
						? `Posts containing “${data.search}”`
						: 'An ordinary day is worth a few words.'}
				</p>
			</div>

			{#if data.user}
				<button
					type="button"
					onclick={() => {
						createOpen = true;
					}}
					class="flex min-h-20 w-full items-center gap-4 rounded-xl border border-line bg-surface p-4 text-left hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-5"
				>
					<Avatar name={data.user.name} src={data.user.image} size="md" />
					<span class="text-base text-muted">Anything from today? Share a moment.</span>
				</button>
			{:else}
				<section
					aria-labelledby="join-heading"
					class="rounded-xl border border-line bg-surface p-5 sm:p-6"
				>
					<h2 id="join-heading" class="text-lg font-semibold text-ink">
						A little space for your day.
					</h2>
					<p class="mt-2 max-w-md text-sm leading-6 text-muted">
						Read along, or make yourself at home. Create an account to share a moment and join the
						conversation.
					</p>
					<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
						<p class="text-xs text-muted">Everyone can read what’s shared here.</p>
						<Button variant="primary" size="sm" href={resolve('/login')}
							>Join the conversation</Button
						>
					</div>
				</section>
			{/if}

			<section class="mt-8 sm:mt-10" aria-labelledby="feed-heading">
				<div
					class="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4"
				>
					<h2 id="feed-heading" class="text-base font-semibold text-ink">
						{data.search ? 'Search results' : viewingOlder ? 'Earlier moments' : 'Recent moments'}
					</h2>
					{#if viewingOlder}
						<a
							href={resolve(data.search ? `/?q=${encodeURIComponent(data.search)}` : '/')}
							class="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
							>Back to newest</a
						>
					{:else}
						<span class="text-xs text-muted">Newest first</span>
					{/if}
				</div>
				{#if data.loadError}
					<div class="py-8">
						<FormMessage type="error" message="We couldn’t load the feed. Please try again." />
						<Button variant="ghost" href={page.url.pathname + page.url.search} class="mt-4"
							>Try again</Button
						>
					</div>
				{:else if data.posts.length > 0}
					<div class="divide-y divide-line">
						{#each data.posts as post (post.id)}
							<PostCard
								id={post.id}
								authorName={post.authorName}
								authorAvatar={post.authorImage ?? null}
								createdAt={post.createdAt}
								content={post.body}
								imageUrl={post.mediaId ? `/api/media/${post.mediaId}` : null}
							/>
						{/each}
					</div>
					<div class="border-t border-line pt-6 text-center">
						{#if data.nextCursor}
							<Button
								variant="secondary"
								href={`${searchUrl}${data.search ? '&' : '?'}cursor=${encodeURIComponent(data.nextCursor)}#feed-heading`}
								loading={!!navigating.to}>Older entries</Button
							>
						{:else}
							<p class="text-sm font-medium text-muted">
								{data.search ? 'That’s all the matches.' : 'You’re caught up.'}
							</p>
							<p class="mt-1 text-xs text-muted">
								{data.search
									? 'Try another word to find a different moment.'
									: 'Come back when there’s another little moment to share.'}
							</p>
						{/if}
					</div>
				{:else}
					<div class="py-8 sm:py-12">
						<EmptyState
							title={data.search
								? 'No matching moments yet'
								: viewingOlder
									? 'No earlier moments'
									: 'The first moment starts here'}
							description={data.search
								? 'Try a different word or phrase, or clear the search to return to the feed.'
								: viewingOlder
									? 'You’ve reached the beginning of the journal.'
									: 'A thought, a small discovery, or a photo from today. It doesn’t have to be anything big.'}
						/>
					</div>
				{/if}
			</section>
		</main>
		<aside
			aria-labelledby="trending-heading"
			class="rounded-xl border border-line bg-surface p-5 xl:sticky xl:top-28"
		>
			<div class="flex items-center gap-3">
				<span class="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent"
					><NotebookPen class="size-5" strokeWidth={1.75} aria-hidden="true" /></span
				>
				<div>
					<h2 id="trending-heading" class="text-base font-semibold text-ink">Trending journals</h2>
					<p class="mt-1 text-xs text-muted">Active this week</p>
				</div>
			</div>
			{#if data.trendingError}
				<p class="mt-5 text-sm leading-6 text-muted">
					We couldn’t load journals right now. Try again in a little while.
				</p>
			{:else if data.trendingJournals.length > 0}
				<ul class="mt-4 divide-y divide-line">
					{#each data.trendingJournals as journal (journal.authorId)}
						<li>
							<a
								href={resolve('/post/[postId]', { postId: journal.id })}
								title="Read their latest entry"
								class="flex gap-3 rounded-lg py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
							>
								<Avatar name={journal.authorName} src={journal.authorImage} size="sm" />
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold text-ink">{journal.authorName}</p>
									<p class="mt-1 line-clamp-2 text-sm leading-5 break-words text-muted">
										{journal.body || 'A photo from their day.'}
									</p>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="mt-5 border-t border-line pt-5">
					<p class="text-sm font-medium text-ink">A quiet week so far.</p>
					<p class="mt-2 text-sm leading-6 text-muted">
						Journals will appear here as people share their everyday moments.
					</p>
				</div>
			{/if}
		</aside>
	</div>
</AppShell>
