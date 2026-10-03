<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Textarea, ImageAttachment, FormMessage, Avatar } from '$lib/components/ui';
	import Send from '@lucide/svelte/icons/send';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Globe from '@lucide/svelte/icons/globe';
	import { onMount } from 'svelte';
	import type { User } from 'better-auth';

	let { user }: { user: User } = $props();

	let body = $state('');
	let file = $state<File | null>(null);
	let fileError = $state<string | null>(null);
	let imageAlt = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let hasDraft = $state(false);

	let placeholder = $state('Anything from today?');

	const draftKey = $derived(`composer_draft_${user.id}`);

	onMount(() => {
		const draft = localStorage.getItem(draftKey);
		if (draft) {
			body = draft;
			hasDraft = true;
		}
	});

	$effect(() => {
		if (body.trim().length > 0) {
			localStorage.setItem(draftKey, body);
			hasDraft = true;
		} else if (hasDraft && body.trim().length === 0) {
			localStorage.removeItem(draftKey);
			hasDraft = false;
		}
	});

	function discardDraft() {
		body = '';
		file = null;
		imageAlt = '';
		localStorage.removeItem(draftKey);
		hasDraft = false;
	}

	function setIdea() {
		placeholder = 'Something you noticed';
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!body.trim() && !file) {
			errorMessage = 'Please write something or attach a photo.';
			return;
		}

		isSubmitting = true;
		errorMessage = null;

		try {
			let mediaId: string | null = null;

			if (file) {
				const formData = new FormData();
				formData.append('photo', file);

				const uploadRes = await fetch('/api/uploads/photo', {
					method: 'POST',
					body: formData
				});

				if (!uploadRes.ok) {
					const errorData = (await uploadRes.json()) as Record<string, string>;
					throw new Error(errorData.error || 'Failed to upload photo');
				}

				const uploadData = (await uploadRes.json()) as { mediaId?: string };
				mediaId = uploadData.mediaId ?? null;
			}

			const postFormData = new FormData();
			postFormData.append('body', body);
			postFormData.append('submissionId', crypto.randomUUID());
			if (mediaId) {
				postFormData.append('mediaId', mediaId);
			}

			const postRes = await fetch(`${resolve('/')}?/createPost`, {
				method: 'POST',
				body: postFormData
			});

			if (!postRes.ok) {
				let errText = 'Failed to create post';
				try {
					const errJson = (await postRes.json()) as {
						data?: { message?: string };
						message?: string;
					};
					if (errJson?.data?.message) errText = errJson.data.message;
					else if (errJson?.message) errText = errJson.message;
				} catch {
					// fallback to default
				}
				throw new Error(errText);
			}

			// Clear everything on success
			discardDraft();

			// Reload page to show new post
			window.location.assign(resolve('/'));
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<section aria-label="Share a moment" class="p-5 sm:p-6">
	<div class="mb-5 flex items-center gap-3">
		<Avatar name={user.name} src={user.image} size="md" />
		<div class="min-w-0">
			<p class="truncate text-base font-semibold text-ink">{user.name}</p>
			<p class="text-sm text-muted">A little piece of your day.</p>
		</div>
	</div>
	<form class="min-w-0 space-y-5" onsubmit={handleSubmit}>
		<div class="space-y-2">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<label for="post-body" class="text-base font-semibold text-ink">A moment from today</label>
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
				{placeholder}
				bind:value={body}
				showCount
				maxCount={2000}
				rows={5}
				autoResize={false}
				class="min-h-40 focus:border-accent focus:bg-accent-soft focus:outline-2 focus:outline-offset-2 focus:outline-accent focus:outline-solid focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid motion-reduce:transition-none"
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

		{#if hasDraft && !isSubmitting}
			<div class="flex items-center gap-2 text-xs text-muted">
				<span>Draft saved on this device</span>
				<span>•</span>
				<button
					type="button"
					class="min-h-11 rounded-sm px-2 text-danger hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					onclick={discardDraft}
				>
					Discard
				</button>
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
				disabled={isSubmitting || (!body.trim() && !file)}
			>
				{#if !isSubmitting}<Send class="size-4" strokeWidth={1.75} aria-hidden="true" />{/if}
				{isSubmitting ? 'Sharing...' : 'Share moment'}
			</Button>
		</div>
	</form>
</section>
