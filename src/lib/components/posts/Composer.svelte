<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Textarea, ImageAttachment, FormMessage, Avatar } from '$lib/components/ui';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPaperPlane, faLightbulb } from '@fortawesome/free-solid-svg-icons';
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

<section aria-label="Share a moment" class="rounded-xl border border-line bg-surface p-4 sm:p-6">
	<div class="flex items-start gap-3 sm:gap-4">
		<div class="hidden shrink-0 sm:block">
			<Avatar name={user.name} src={user.image} size="md" />
		</div>
		<form class="min-w-0 flex-1 space-y-4" onsubmit={handleSubmit}>
			<div class="space-y-2">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<label for="post-body" class="text-base font-semibold text-ink">A moment from today</label
					>
					<button
						type="button"
						class="flex min-h-11 items-center gap-1 rounded-sm text-xs text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						onclick={setIdea}
					>
						<FontAwesomeIcon icon={faLightbulb} class="size-3" />
						Need an idea?
					</button>
				</div>
				<Textarea
					id="post-body"
					{placeholder}
					bind:value={body}
					showCount
					maxCount={2000}
					rows={3}
					class="focus:bg-accent-soft"
					disabled={isSubmitting}
				/>
			</div>

			<ImageAttachment bind:file bind:error={fileError} maxSizeMB={5} />

			{#if file}
				<div class="space-y-1">
					<label for="image-alt" class="text-xs font-medium text-ink"
						>Image description (optional)</label
					>
					<input
						type="text"
						id="image-alt"
						bind:value={imageAlt}
						class="w-full rounded-lg border border-control-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
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
					<button type="button" class="text-danger hover:underline" onclick={discardDraft}>
						Discard
					</button>
				</div>
			{/if}

			<div class="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
				<p class="max-w-40 text-xs leading-5 text-muted sm:max-w-none">
					Posts are visible to everyone.
				</p>
				<Button
					variant="primary"
					type="submit"
					loading={isSubmitting}
					disabled={isSubmitting || (!body.trim() && !file)}
				>
					<FontAwesomeIcon icon={faPaperPlane} class="mr-2 size-4" />
					{isSubmitting ? 'Sharing...' : 'Share moment'}
				</Button>
			</div>
		</form>
	</div>
</section>
