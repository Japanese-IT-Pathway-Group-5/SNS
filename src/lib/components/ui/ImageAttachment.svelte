<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faImage, faXmark, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';

	let {
		file = $bindable(null),
		// eslint-disable-next-line no-useless-assignment
		error = $bindable(null),
		maxSizeMB = 5
	}: {
		file?: File | null;
		error?: string | null;
		maxSizeMB?: number;
	} = $props();

	let fileInput = $state<HTMLInputElement | null>(null);
	let previewUrl = $state<string | null>(null);
	let isDragging = $state(false);

	// Watch for file changes from outside (e.g., clearing the form after post)
	$effect(() => {
		if (!file && previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
	});

	function handleFile(newFile: File | null) {
		error = null;

		if (!newFile) {
			file = null;
			return;
		}

		// Validation
		const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!validTypes.includes(newFile.type)) {
			error = 'Please select a JPEG, PNG, or WebP image.';
			return;
		}

		if (newFile.size > maxSizeMB * 1024 * 1024) {
			error = `Image must be smaller than ${maxSizeMB}MB.`;
			return;
		}

		file = newFile;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = URL.createObjectURL(newFile);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function onDragLeave() {
		isDragging = false;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			handleFile(e.dataTransfer.files[0]);
		}
	}

	function onChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFile(target.files[0]);
		}
	}

	function clearImage(e: Event) {
		e.stopPropagation(); // prevent clicking the container
		handleFile(null);
		if (fileInput) fileInput.value = '';
	}
</script>

<div class="relative w-full">
	{#if previewUrl}
		<!-- Image Preview -->
		<div
			class="group relative mt-2 overflow-hidden rounded-xl border border-control-border bg-surface-muted shadow-sm transition-all"
		>
			<img
				src={previewUrl}
				alt="Selected attachment preview"
				class="max-h-[400px] w-full object-contain"
			/>

			<!-- Subtle gradient overlay to ensure the remove button is always visible -->
			<div
				class="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
			></div>

			<button
				type="button"
				class="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-danger focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
				aria-label="Remove image"
				onclick={clearImage}
			>
				<FontAwesomeIcon icon={faXmark} class="size-4" />
			</button>
		</div>
	{:else}
		<!-- Upload Zone -->
		<input
			type="file"
			accept="image/jpeg, image/png, image/webp"
			class="hidden"
			bind:this={fileInput}
			onchange={onChange}
		/>

		<div
			class="mt-2 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all hover:border-accent hover:bg-surface-muted/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none {isDragging
				? 'scale-[1.02] border-accent bg-accent-soft'
				: 'border-line bg-surface'}"
			ondragover={onDragOver}
			ondragleave={onDragLeave}
			ondrop={onDrop}
			onclick={() => fileInput?.click()}
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput?.click()}
			role="button"
			tabindex="0"
			aria-label="Upload an image"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform group-hover:scale-110 {isDragging
					? 'scale-110'
					: ''}"
			>
				<FontAwesomeIcon icon={isDragging ? faCloudArrowUp : faImage} class="size-5" />
			</div>

			<div class="mt-3 space-y-1 text-center">
				<p class="text-sm font-medium text-ink">
					{isDragging ? 'Drop photo here' : 'Click or drag to add a photo'}
				</p>
				<p class="text-xs text-muted">JPEG, PNG, or WebP up to {maxSizeMB}MB</p>
			</div>
		</div>
	{/if}
</div>
