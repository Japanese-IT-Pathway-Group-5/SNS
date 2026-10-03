<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, EmptyState } from '$lib/components/ui';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faGear } from '@fortawesome/free-solid-svg-icons';
	import { Composer, PostCard } from '$lib/components/posts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Claymore — Everyday Journal</title>
	<meta
		name="description"
		content="A shared journal for everyday moments. Browse publicly or sign in to post."
	/>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
	<header class="mb-8 flex items-center justify-between border-b border-line pb-6">
		<div class="flex items-center gap-6">
			<a
				href={resolve('/')}
				class="flex items-center gap-2.5 rounded-md text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
				aria-label="Claymore home"
			>
				<img src="/logo.svg" alt="" class="size-9" />
				<span class="text-xl font-bold tracking-tight sm:text-2xl">Claymore</span>
			</a>
			<nav class="hidden space-x-6 sm:flex" aria-label="Main navigation">
				<span class="text-sm font-medium text-ink">Home</span>
				{#if data.user}
					<a href={resolve('/settings')} class="text-sm font-medium text-muted hover:text-ink"
						>My journal</a
					>
				{/if}
			</nav>
		</div>
		<div class="flex items-center gap-2">
			{#if data.user}
				<Button variant="ghost" size="sm" href="/settings" aria-label="Settings">
					<FontAwesomeIcon icon={faGear} class="size-4 text-muted hover:text-ink" />
					<span class="hidden sm:inline">Settings</span>
				</Button>
			{:else}
				<Button variant="primary" size="sm" href="/login">Sign in</Button>
			{/if}
		</div>
	</header>

	{#if data.user}
		<Composer user={data.user} />
	{:else}
		<section class="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
			<h2 class="text-base font-semibold text-ink">Today's entry</h2>
			<p class="mt-1 text-sm leading-6 text-muted">
				Browse the journal without an account. Sign in with Google to post, comment, and create your
				profile.
			</p>
			<div
				class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3"
			>
				<p class="text-xs text-muted">Posts are visible to everyone.</p>
				<Button variant="primary" size="sm" href="/login?redirectTo=%2F">Sign in to post</Button>
			</div>
		</section>
	{/if}

	<div class="mt-8 space-y-8 divide-y divide-line/60">
		{#if data.posts && data.posts.length > 0}
			{#each data.posts as post (post.id)}
				<div class="pt-8 first:pt-0">
					<PostCard
						id={post.id}
						authorName={post.authorName}
						authorAvatar={post.authorImage ?? null}
						createdAt={post.createdAt}
						content={post.body}
						imageUrl={post.mediaId ? `/api/media/${post.mediaId}` : null}
						replyCount={0}
					/>
				</div>
			{/each}
			<div class="py-8 text-center text-sm font-medium text-muted">You're caught up.</div>
		{:else}
			<div class="pt-8">
				<EmptyState
					title="No journal entries yet"
					description="Be the first to share an everyday moment."
				/>
			</div>
		{/if}
	</div>
</main>
