<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { User } from 'better-auth';
	import Heart from '@lucide/svelte/icons/heart';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Button from '$lib/components/ui/Button.svelte';
	import FormMessage from '$lib/components/ui/FormMessage.svelte';
	import { getUiPreferences, t } from '$lib/preferences/ui';

	let {
		postId,
		initiallyLiked = false,
		user = null
	}: {
		postId: string;
		initiallyLiked?: boolean;
		user?: User | null;
	} = $props();

	const ui = getUiPreferences();
	let liked = $derived(initiallyLiked);
	let isUpdating = $state(false);
	let status = $state('');
	let failure = $state('');

	async function toggleLike() {
		if (!user) {
			await goto(resolve(`/login?redirectTo=${encodeURIComponent(`/post/${postId}`)}`));
			return;
		}
		if (isUpdating) return;

		isUpdating = true;
		status = '';
		failure = '';
		try {
			const response = await fetch(resolve(`/api/posts/${postId}/like`), {
				method: liked ? 'DELETE' : 'PUT'
			});
			if (!response.ok) throw new Error('Like update failed');
			const result = (await response.json()) as { liked: boolean };
			liked = result.liked;
			status = t(ui, result.liked ? 'post.liked' : 'post.unliked');
		} catch {
			failure = t(ui, 'post.likeFailed');
		} finally {
			isUpdating = false;
		}
	}

	async function sharePost() {
		status = '';
		failure = '';
		const url = new URL(resolve('/post/[postId]', { postId }), window.location.origin).href;
		try {
			if (navigator.share) {
				await navigator.share({ title: 'Claymore', url });
			} else {
				await navigator.clipboard.writeText(url);
				status = t(ui, 'post.shareCopied');
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			failure = t(ui, 'post.shareFailed');
		}
	}
</script>

<div class="flex flex-wrap items-center gap-1">
	{#if user}
		<Button
			variant="ghost"
			size="sm"
			loading={isUpdating}
			disabled={isUpdating}
			aria-label={liked ? t(ui, 'post.unlike') : t(ui, 'post.like')}
			aria-pressed={liked}
			class={liked ? 'text-accent' : 'text-muted'}
			onclick={toggleLike}
		>
			<Heart class="size-4" fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
			<span>{liked ? t(ui, 'post.unlike') : t(ui, 'post.like')}</span>
		</Button>
	{:else}
		<Button
			variant="ghost"
			size="sm"
			href={resolve(`/login?redirectTo=${encodeURIComponent(`/post/${postId}`)}`)}
			aria-label={t(ui, 'post.like')}
			class="text-muted"
		>
			<Heart class="size-4" aria-hidden="true" />
			<span>{t(ui, 'post.like')}</span>
		</Button>
	{/if}
	<Button variant="ghost" size="sm" onclick={sharePost} aria-label={t(ui, 'post.share')}>
		<Share2 class="size-4" aria-hidden="true" />
		<span>{t(ui, 'post.share')}</span>
	</Button>
</div>
{#if status}<p role="status" class="text-xs text-muted">{status}</p>{/if}
{#if failure}<FormMessage type="error" message={failure} />{/if}
