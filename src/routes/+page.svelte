<script lang="ts">
	import { Button, Card, Badge, EmptyState } from '$lib/components/ui';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faWandMagicSparkles,
		faPalette,
		faArrowRight,
		faSeedling,
		faGear
	} from '@fortawesome/free-solid-svg-icons';
	import { Composer, PostCard } from '$lib/components/posts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>SNS — Everyday Journal</title>
</svelte:head>

{#if data.user}
	<div class="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
		<header class="mb-8 flex items-center justify-between border-b border-line pb-6">
			<div class="flex items-center gap-6">
				<h1 class="text-xl font-bold tracking-tight text-ink sm:text-2xl">SNS</h1>
				<nav class="hidden space-x-6 sm:flex">
					<span class="text-sm font-medium text-ink">Home</span>
					<span class="text-sm font-medium text-muted hover:text-ink">My journal</span>
				</nav>
			</div>
			<div class="flex items-center gap-3">
				<Button variant="ghost" size="sm" href="/settings" aria-label="Settings">
					<FontAwesomeIcon icon={faGear} class="size-4 text-muted hover:text-ink" />
					<span class="hidden sm:inline">Settings</span>
				</Button>
			</div>
		</header>

		<Composer user={data.user} />

		<div class="mt-8 space-y-8 divide-y divide-line/60">
			{#if data.posts && data.posts.length > 0}
				{#each data.posts as post}
					<div class="pt-8 first:pt-0">
						<PostCard {post} />
					</div>
				{/each}

				<div class="py-8 text-center text-sm font-medium text-muted">You're caught up.</div>
			{:else}
				<div class="pt-8">
					<EmptyState
						title="No journal entries yet"
						description="Your day doesn't have to be special. Write down a small thought or what you had for lunch."
					/>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<main class="mx-auto max-w-xl space-y-10 px-4 py-16 text-center sm:py-24">
		<div class="space-y-4">
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted/50 text-accent"
			>
				<FontAwesomeIcon icon={faSeedling} class="size-8" />
			</div>
			<h1 class="text-3xl font-bold tracking-tight text-ink sm:text-5xl">Everyday Journal</h1>
			<p class="mx-auto max-w-md text-base leading-relaxed text-muted sm:text-lg">
				A cozy, private place to record your days. Your day doesn't have to be special to be worth
				sharing.
			</p>
		</div>

		<div class="mx-auto max-w-sm space-y-4">
			<Button variant="primary" class="w-full" href="/login">
				<span>Log In to Your Journal</span>
				<FontAwesomeIcon icon={faArrowRight} class="ml-2 size-4" />
			</Button>
		</div>
	</main>
{/if}
