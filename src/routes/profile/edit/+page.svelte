<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import {
		AppShell,
		Avatar,
		Button,
		BackButton,
		Input,
		Textarea,
		FormMessage
	} from '$lib/components/ui';
	import BannerEditor from '$lib/components/profile/BannerEditor.svelte';
	import ProfilePhotoCropper from '$lib/components/profile/ProfilePhotoCropper.svelte';
	import { MAX_PROFILE_DESCRIPTION_LENGTH } from '$lib/validation/profile';
	import { MAX_PHOTO_BYTES } from '$lib/validation/photo-upload';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const initial = untrack(() => {
		const submitted =
			form && 'values' in form && form.values && typeof form.values === 'object'
				? (form.values as Record<string, unknown>)
				: null;
		return {
			name: typeof submitted?.name === 'string' ? submitted.name : data.profile.name,
			description:
				typeof submitted?.description === 'string'
					? submitted.description
					: data.profile.description,
			removePhoto: submitted?.removePhoto === true,
			banner: typeof submitted?.banner === 'string' ? submitted.banner : (data.profile.banner ?? '')
		};
	});
	let name = $state(initial.name);
	let description = $state(initial.description);
	let removePhoto = $state(initial.removePhoto);
	let banner = $state(initial.banner);
	let selectedPhoto = $state<File | null>(null);
	let photoInput = $state<HTMLInputElement>();
	let preview = $state<string>();
	let saving = $state(false);
	let message = $state(untrack(() => form?.message ?? ''));
	let photoError = $state('');
	let cropFile = $state<File | null>(null);
	let cropOpen = $state(false);
	$effect(() => {
		if (!selectedPhoto) {
			preview = undefined;
			return;
		}
		const url = URL.createObjectURL(selectedPhoto);
		preview = url;
		return () => URL.revokeObjectURL(url);
	});
	function choosePhoto(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
		photoError = file && file.size > MAX_PHOTO_BYTES ? 'Choose a photo smaller than 5 MiB.' : '';
		if (file && !photoError) {
			if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
				photoError = 'Choose a JPEG, PNG or WebP photo.';
			} else { cropFile = file; cropOpen = true; }
		}
		if (photoInput) photoInput.value = '';
	}
</script>

<svelte:head><title>Edit profile — Claymore</title></svelte:head>

<AppShell user={data.user}>
	<main class="w-full min-w-0">
		<header class="mb-6 sm:mb-8">
			<BackButton href={resolve('/journal')} class="mb-2 -ml-2" />
			<h1 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Edit profile</h1>
			<p class="mt-2 text-sm leading-6 text-muted">
				A little space to make your journal feel like you.
			</p>
		</header>
		<form
			method="POST"
			enctype="multipart/form-data"
			class="space-y-6"
			use:enhance={({ formData }) => {
				if (selectedPhoto && !removePhoto) formData.set('photo', selectedPhoto);
				saving = true;
				message = '';
				return async ({ result, update }) => {
					try {
						if (result.type === 'redirect') await update();
						else if (result.type === 'failure')
							message = String(
								result.data?.message ?? 'Could not save your profile. Please try again.'
							);
						else message = 'Could not save your profile. Please try again.';
					} finally {
						saving = false;
					}
				};
			}}
		>
			<section
				aria-labelledby="photo-heading"
				class="rounded-xl border border-line bg-surface p-4 sm:p-6"
			>
				<h2 id="photo-heading" class="text-base font-semibold text-ink">Profile photo</h2>
				<div class="mt-4 flex items-center gap-4">
					<Avatar {name} src={removePhoto ? null : (preview ?? data.profile.image)} size="lg" />
					<p class="text-sm leading-6 text-muted">Shown beside your entries and replies.</p>
				</div>
				<label for="profile-photo" class="mt-4 block text-sm font-semibold text-ink"
					>Choose a photo</label
				>
				<input
					id="profile-photo"
					bind:this={photoInput}
					type="file"
					name="photo"
					accept="image/jpeg,image/png,image/webp"
					disabled={saving}
					onchange={choosePhoto}
					aria-describedby="photo-help"
					aria-invalid={Boolean(photoError)}
					class="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-control-border bg-surface p-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
				/>
				<p id="photo-help" class="mt-2 text-xs text-muted">
					JPEG, PNG or WebP, up to 5 MiB. Your profile photo is visible to everyone.
				</p>
				{#if photoError}<div class="mt-3">
						<FormMessage type="error" message={photoError} />
					</div>{/if}
				{#if data.profile.image || selectedPhoto || removePhoto}
					<label class="mt-3 flex min-h-11 items-center gap-3 text-sm text-ink">
						<input
							type="checkbox"
							name="removePhoto"
							bind:checked={removePhoto}
							disabled={saving}
							onchange={(event) => {
								if (event.currentTarget.checked) {
									selectedPhoto = null;
									if (photoInput) photoInput.value = '';
									photoError = '';
								}
							}}
							class="size-4 accent-accent"
						/>Remove profile photo
					</label>
				{/if}
			</section>
			<section
				aria-labelledby="details-heading"
				class="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-6"
			>
				<h2 id="details-heading" class="text-base font-semibold text-ink">About you</h2>
				<Input
					id="profile-name"
					label="Name"
					name="name"
					bind:value={name}
					required
					maxlength={80}
					autocomplete="name"
					disabled={saving}
				/>
				<Textarea
					id="profile-description"
					label="Description"
					name="description"
					bind:value={description}
					rows={3}
					maxCount={MAX_PROFILE_DESCRIPTION_LENGTH}
					showCount
					disabled={saving}
					description="A few words about you. Leave blank if you prefer."
				/>
			</section>
			<section
				aria-labelledby="banner-heading"
				class="rounded-xl border border-line bg-surface p-4 sm:p-6"
			>
				<h2 id="banner-heading" class="text-base font-semibold text-ink">Journal banner</h2>
				<BannerEditor bind:value={banner} disabled={saving} />
			</section>
			{#if message}<FormMessage type="error" {message} />{/if}
			<div class="flex flex-wrap gap-3">
				<Button type="submit" loading={saving} disabled={saving || Boolean(photoError)}
					>Save profile</Button
				>
				{#if !saving}<Button variant="ghost" href={resolve('/journal')}>Cancel</Button>{/if}
			</div>
		</form>
	</main>
</AppShell>

<ProfilePhotoCropper file={cropFile} bind:open={cropOpen} onUse={(file) => {
	selectedPhoto = file;
	removePhoto = false;
	photoError = '';
	if (photoInput) {
		const selection = new DataTransfer();
		selection.items.add(file);
		photoInput.files = selection.files;
	}
}} />
