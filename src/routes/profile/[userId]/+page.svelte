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
	import BannerArtwork from '$lib/components/profile/BannerArtwork.svelte';
	import Palette from '@lucide/svelte/icons/palette';
	import { groupByDate } from '$lib/journal/group-by-date';
	import type { PageData } from './$types';
	import { getUiPreferences, t } from '$lib/preferences/ui';
	let { data }: { data: PageData } = $props();
	const ui = getUiPreferences();
	let timeZone = $state<string | undefined>('UTC');
	onMount(() => {
		timeZone = undefined;
	});
	const groups = $derived(
		groupByDate(data.posts, {
			timeZone,
			locale: ui.language === 'ja' ? 'ja-JP' : 'en'
		})
	);
	const profileUrl = $derived(resolve('/profile/[userId]', { userId: data.profile.id }));
	const viewingOlder = $derived(page.url.searchParams.has('cursor'));
</script>

<svelte:head><title>{data.profile.name} - {t(ui, 'journal.title')} - Claymore</title></svelte:head>
<AppShell user={data.user}>
	<main class="w-full min-w-0">
		<BackButton href={resolve('/')} label={t(ui, 'common.backHome')} class="mb-6" />
		<header class="mb-6 sm:mb-8">
			<div class="h-32 overflow-hidden rounded-xl border border-line sm:h-40">
				{#if data.profile.banner}
					<div class="h-full overflow-hidden rounded-xl">
						<BannerArtwork value={data.profile.banner} />
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
					name={data.profile.name}
					src={data.profile.image}
					size="lg"
					class="size-20 bg-surface text-xl ring-4 ring-canvas sm:size-24 sm:text-2xl"
				/>
				<div class="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:pt-12">
					<h1 class="text-2xl font-semibold tracking-tight break-words text-ink sm:text-3xl">
						{data.profile.name}
					</h1>
					<div class="mt-1 min-h-6">
						{#if data.profile.description}
							<p class="text-sm leading-6 break-words whitespace-pre-wrap text-muted sm:text-base">
								{data.profile.description}
							</p>
						{/if}
					</div>
				</div>
				{#if data.user?.id === data.profile.id}<div
						class="col-start-2 row-start-1 flex justify-end pt-10 sm:col-start-3 sm:pt-12"
					>
						<Button variant="secondary" size="sm" href={resolve('/profile/edit')}>
							{t(ui, 'journal.editProfile')}
						</Button>
					</div>{/if}
			</div>
		</header>
		<section aria-labelledby="profile-entries">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
				<h2 id="profile-entries" class="text-base font-semibold text-ink">
					{viewingOlder ? t(ui, 'journal.earlier') : t(ui, 'profile.entries')}
				</h2>
				<span class="text-xs text-muted">{t(ui, 'profile.publicNewest')}</span>
			</div>
			{#if viewingOlder}<BackButton
					href={profileUrl}
					label={t(ui, 'common.backNewest')}
					class="mb-4"
				/>{/if}
			{#if data.loadError}
				<FormMessage type="error" message={t(ui, 'profile.loadError')} />
				<Button variant="secondary" href={page.url.pathname + page.url.search} class="mt-4"
					>{t(ui, 'common.tryAgain')}</Button
				>
			{:else if groups.length}
				<div class="space-y-6">
					{#each groups as group (group.key)}
						<section aria-label={group.label}>
							<h3 class="text-sm font-semibold text-muted">{group.label}</h3>
							<div class="mt-3 space-y-4">
								{#each group.entries as post (post.id)}
									<PostCard
										id={post.id}
										authorId={post.authorId}
										authorName={post.authorName}
										authorAvatar={post.authorImage}
										createdAt={post.createdAt}
										content={post.body}
										replyCount={post.replyCount}
										isLiked={post.isLiked}
										user={data.user}
										imageUrl={post.mediaId ? '/api/media/' + post.mediaId : null}
									/>
								{/each}
							</div>
						</section>
					{/each}
				</div>
				{#if data.nextCursor}
					<Button
						variant="secondary"
						class="mt-6"
						href={profileUrl +
							'?cursor=' +
							encodeURIComponent(data.nextCursor) +
							'#profile-entries'}>{t(ui, 'common.olderEntries')}</Button
					>
				{:else}<p class="mt-6 text-sm text-muted">
						You've reached the beginning of this journal.
					</p>{/if}
			{:else}
				<EmptyState
					title={viewingOlder ? t(ui, 'common.noEarlier') : t(ui, 'profile.emptyTitle')}
					description={t(ui, 'profile.emptyDescription')}
				/>
			{/if}
		</section>
	</main>
</AppShell>
