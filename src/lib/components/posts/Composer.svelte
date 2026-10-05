<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { MAX_POST_LENGTH, unicodeCodePointLength } from '$lib/validation/posts';
	import { Button, Textarea, ImageAttachment, FormMessage, Avatar } from '$lib/components/ui';
	import Send from '@lucide/svelte/icons/send';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Globe from '@lucide/svelte/icons/globe';
	import { onMount } from 'svelte';
	import type { User } from 'better-auth';
	import {
		createDraftPersistence,
		DRAFT_CLEAR_EVENT,
		type DraftStatus
	} from '$lib/drafts/persistence';

	let { user, onSuccess }: { user: User; onSuccess?: () => void } = $props();
	let body = $state('');
	let file = $state<File | null>(null);
	let fileError = $state<string | null>(null);
	let imageAlt = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let draftStatus = $state<DraftStatus>('idle');
	let draftPersistence: ReturnType<typeof createDraftPersistence> | undefined;
	let lastScheduledBody = '';
	let submissionId = $state(crypto.randomUUID());
	let storageReady = $state(false);
	let tooLong = $derived(unicodeCodePointLength(body) > MAX_POST_LENGTH);
	let placeholder = $state('Anything from today?');

	onMount(() => {
		draftPersistence = createDraftPersistence(
			user.id,
			() => localStorage,
			(status) => {
				draftStatus = status;
			}
		);
		body = draftPersistence.restore();
		lastScheduledBody = body;
		storageReady = true;
		const flush = () => draftPersistence?.flush();
		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') flush();
		};
		const onClear = (event: Event) => {
			if ((event as CustomEvent<string>).detail === user.id) discardDraft();
		};
		window.addEventListener('pagehide', flush);
		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener(DRAFT_CLEAR_EVENT, onClear);
		return () => {
			flush();
			window.removeEventListener('pagehide', flush);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener(DRAFT_CLEAR_EVENT, onClear);
		};
	});
	$effect(() => {
		if (!storageReady || body === lastScheduledBody) return;
		lastScheduledBody = body;
		draftPersistence?.schedule(body);
	});
	function discardDraft() {
		lastScheduledBody = '';
		body = '';
		file = null;
		fileError = null;
		imageAlt = '';
		errorMessage = null;
		submissionId = crypto.randomUUID();
		draftPersistence?.clear();
	}
	function setIdea() {
		placeholder = 'Something you noticed';
	}

	const submitPost: SubmitFunction = async ({ formData, cancel }) => {
		if (isSubmitting) {
			cancel();
			return;
		}
		if (tooLong || (!body.trim() && !file)) {
			errorMessage = tooLong
				? `Please shorten your entry to ${MAX_POST_LENGTH} characters or fewer.`
				: 'Please write something or attach a photo.';
			cancel();
			return;
		}
		isSubmitting = true;
		errorMessage = null;
		draftPersistence?.flush();
		try {
			if (file) {
				const uploadForm = new FormData();
				uploadForm.append('file', file);
				const response = await fetch(resolve('/api/uploads/photo'), {
					method: 'POST',
					body: uploadForm
				});
				if (!response.ok) throw new Error('upload');
				const uploaded = (await response.json()) as { mediaId?: string };
				if (!uploaded.mediaId) throw new Error('upload');
				formData.set('mediaId', uploaded.mediaId);
			}
		} catch {
			cancel();
			isSubmitting = false;
			errorMessage =
				'Your photo could not be uploaded. Your entry is still here. Please try again.';
			return;
		}
		return async ({ result }) => {
			try {
				if (result.type === 'success' && result.data?.success === true) {
					discardDraft();
					onSuccess?.();
					await goto(resolve('/'), { invalidateAll: true });
				} else if (
					(result.type === 'failure' || result.type === 'error') &&
					result.status === 401
				) {
					errorMessage = 'Please sign in again before posting. Your entry is still here.';
				} else if (result.type === 'failure' && typeof result.data?.message === 'string') {
					errorMessage = result.data.message;
				} else {
					errorMessage =
						'Your entry could not be posted. Please try again; your text is still here.';
				}
			} finally {
				isSubmitting = false;
			}
		};
	};
</script>

<section aria-label="Share a moment" class="p-4 sm:p-6">
	<div class="mb-4 flex items-center gap-3">
		<Avatar name={user.name} src={user.image} size="md" />
		<div class="min-w-0">
			<p class="truncate text-base font-semibold text-ink">{user.name}</p>
			<p class="flex items-center gap-1.5 text-xs text-muted">
				<Globe class="size-3.5" aria-hidden="true" />Visible to everyone
			</p>
		</div>
	</div>
	<form
		class="min-w-0 space-y-4"
		method="POST"
		action={`${resolve('/')}?/createPost`}
		use:enhance={submitPost}
		aria-busy={isSubmitting}
	>
		<input type="hidden" name="submissionId" value={submissionId} />
		<p class="sr-only" role="status">{isSubmitting ? 'Posting...' : ''}</p>
		<div class="space-y-2">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<label for="post-body" class="text-base font-semibold text-ink">Today's entry</label>
				<button
					type="button"
					class="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-accent hover:outline-2 hover:outline-offset-2 hover:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					onclick={setIdea}
					disabled={isSubmitting}
				>
					<Lightbulb class="size-4" strokeWidth={1.75} aria-hidden="true" />
					Need an idea?
				</button>
			</div>
			<Textarea
				id="post-body"
				name="body"
				{placeholder}
				bind:value={body}
				showCount
				maxCount={MAX_POST_LENGTH}
				error={tooLong
					? `Please shorten your entry to ${MAX_POST_LENGTH} characters or fewer.`
					: undefined}
				rows={4}
				autoResize
				class="min-h-32 focus:border-accent focus:bg-accent-soft focus:outline-2 focus:outline-offset-2 focus:outline-accent focus:outline-solid focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid motion-reduce:transition-none"
				disabled={isSubmitting}
			/>
		</div>

		<ImageAttachment bind:file bind:error={fileError} maxSizeMB={5} disabled={isSubmitting} />
		{#if fileError}<FormMessage type="error" message={fileError} />{/if}

		{#if file}
			<div class="space-y-1">
				<label for="image-alt" class="text-sm font-semibold text-ink"
					>Image description (optional)</label
				>
				<input
					type="text"
					id="image-alt"
					bind:value={imageAlt}
					class="w-full rounded-lg border border-control-border bg-surface px-3.5 py-2.5 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:border-accent focus:bg-accent-soft focus:outline-2 focus:outline-offset-2 focus:outline-accent motion-reduce:transition-none"
					placeholder="What's in this photo?"
					disabled={isSubmitting}
				/>
			</div>
		{/if}

		{#if errorMessage}
			<FormMessage type="error" message={errorMessage} />
		{/if}

		{#if (body.length || file) && !isSubmitting}
			<div class="flex items-start justify-between gap-3 rounded-lg bg-canvas px-3 py-2">
				<div class="min-w-0 py-1 text-xs leading-5 text-muted">
					{#if body.length}
						<p role="status">
							{draftStatus === 'saved'
								? 'Text draft saved'
								: draftStatus === 'unavailable'
									? 'Draft saving unavailable. Keep this page open.'
									: 'Saving text draft...'}
						</p>
					{/if}
					{#if file}<p>Reselect your photo if you reload.</p>{/if}
				</div>
				<button
					type="button"
					class="min-h-11 shrink-0 rounded-lg px-2 text-xs text-muted hover:bg-surface-muted hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					onclick={discardDraft}>Clear draft</button
				>
			</div>
		{/if}

		<div class="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
			<p class="flex items-center gap-2 text-sm leading-5 text-muted">
				<Globe class="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
				Posts are visible to everyone.
			</p>
			<Button
				variant="primary"
				type="submit"
				loading={isSubmitting}
				class="min-h-12 w-full font-semibold shadow-none sm:w-auto"
				disabled={isSubmitting || tooLong || (!body.trim() && !file)}
			>
				{#if !isSubmitting}<Send class="size-4" strokeWidth={1.75} aria-hidden="true" />{/if}
				{isSubmitting ? 'Posting...' : 'Post'}
			</Button>
		</div>
	</form>
</section>
