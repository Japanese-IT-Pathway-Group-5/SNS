<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page, navigating } from '$app/state';
	import { AppShell, Button, EmptyState, FormMessage } from '$lib/components/ui';
	import { PostCard } from '$lib/components/posts';
	import { groupByDate } from '$lib/journal/group-by-date';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let createOpen = $state(false);
	// The server renders in UTC; switch to the reader's own time zone once in the browser.
	let timeZone = $state<string | undefined>('UTC');
	onMount(() => {
		timeZone = undefined;
	});

	const viewingOlder = $derived(page.url.searchParams.has('cursor'));
	const groups = $derived(groupByDate(data.posts, { timeZone }));
</script>

<svelte:head>
	<title>My journal — Claymore</title>
</svelte:head>

<AppShell user={data.user} bind:createOpen>
	<main id="journal" class="mx-auto w-full max-w-2xl px-4 pt-7 pb-12 sm:px-6 sm:pt-9 sm:pb-16">
		<div class="mb-6 sm:mb-8">
			<h1 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">My journal</h1>
			<p class="mt-2 text-sm leading-6 text-muted sm:text-base">
				Everything you’ve written, day by day.
			</p>
			<p class="mt-1 text-xs text-muted">
				Only you see this collection, but each moment is still visible to everyone on Claymore.
			</p>
		</div>

		<section aria-labelledby="journal-heading">
			<div class="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
				<h2 id="journal-heading" class="text-base font-semibold text-ink">
					{viewingOlder ? 'Earlier entries' : 'Your entries'}
				</h2>
				{#if viewingOlder}
					<a
						href={resolve('/journal')}
						class="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>Back to newest</a
					>
				{:else}
					<span class="text-xs text-muted">Newest first</span>
				{/if}
			</div>

			{#if data.loadError}
				<div class="py-8">
					<FormMessage type="error" message="We couldn’t load your journal. Please try again." />
					<Button variant="ghost" href={page.url.pathname + page.url.search} class="mt-4"
						>Try again</Button
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
						<div class="divide-y divide-line">
							{#each group.entries as post (post.id)}
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
					</section>
				{/each}
				<div class="mt-2 border-t border-line pt-6 text-center">
					{#if data.nextCursor}
						<Button
							variant="secondary"
							href={`${resolve('/journal')}?cursor=${encodeURIComponent(data.nextCursor)}#journal-heading`}
							loading={!!navigating.to}>Older entries</Button
						>
					{:else}
						<p class="text-sm font-medium text-muted">You’ve reached your very first entry.</p>
					{/if}
				</div>
			{:else}
				<div class="py-8 sm:py-12">
					<EmptyState
						title={viewingOlder ? 'No earlier entries' : 'Your journal starts today'}
						description={viewingOlder
							? 'You’ve reached the beginning of your journal.'
							: 'Every moment you share will be kept here, grouped by day. It doesn’t have to be anything big.'}
					>
						{#snippet action()}
							{#if viewingOlder}
								<Button variant="ghost" href={resolve('/journal')}>Back to newest</Button>
							{:else}
								<Button
									variant="primary"
									onclick={() => {
										createOpen = true;
									}}>Write your first moment</Button
								>
							{/if}
						{/snippet}
					</EmptyState>
				</div>
			{/if}
		</section>
	</main>
</AppShell>
