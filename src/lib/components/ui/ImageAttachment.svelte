<script lang="ts">
	import Image from '@lucide/svelte/icons/image';
	import X from '@lucide/svelte/icons/x';
	import Upload from '@lucide/svelte/icons/upload';

	let {
		file = $bindable(null),
		// eslint-disable-next-line no-useless-assignment
		error = $bindable(null),
		maxSizeMB = 5,
		disabled = false
	}: {
		file?: File | null;
		error?: string | null;
		maxSizeMB?: number;
		disabled?: boolean;
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
		if (disabled) return;
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
		if (disabled) return;
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
		<div class="relative overflow-hidden rounded-lg border border-control-border bg-surface-muted">
			<img
				src={previewUrl}
				alt="Selected attachment preview"
				class="max-h-[400px] w-full object-contain"
			/>

			<button
				type="button"
				{disabled}
				class="absolute top-3 right-3 flex size-11 items-center justify-center rounded-lg border border-control-border bg-surface text-ink hover:outline-2 hover:outline-offset-2 hover:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
				aria-label="Remove image"
				onclick={clearImage}
			>
				<X class="size-5" strokeWidth={1.75} aria-hidden="true" />
			</button>
		</div>
	{:else}
		<!-- Upload Zone -->
		<input
			type="file"
			accept="image/jpeg, image/png, image/webp"
			class="hidden"
			{disabled}
			bind:this={fileInput}
			onchange={onChange}
		/>

		<button
			type="button"
			{disabled}
			class="flex min-h-24 w-full items-center gap-4 rounded-lg border border-control-border px-4 py-4 text-left transition-colors duration-150 focus-visible:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent enabled:hover:outline-2 enabled:hover:outline-offset-2 enabled:hover:outline-accent disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none {isDragging
				? 'border-accent bg-accent-soft'
				: 'bg-surface'}"
			ondragover={onDragOver}
			ondragleave={onDragLeave}
			ondrop={onDrop}
			onclick={() => fileInput?.click()}
			aria-label="Add a photo (optional)"
		>
			<div
				class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
			>
				{#if isDragging}<Upload class="size-5" strokeWidth={1.75} aria-hidden="true" />{:else}<Image
						class="size-5"
						strokeWidth={1.75}
						aria-hidden="true"
					/>{/if}
			</div>

			<div class="min-w-0 space-y-1">
				<p class="text-sm font-semibold text-ink">
					{isDragging ? 'Drop your photo here' : 'Add a photo (optional)'}
				</p>
				<p class="text-xs leading-5 text-muted">
					Choose or drag a JPEG, PNG, or WebP up to {maxSizeMB} MB.
				</p>
			</div>
		</button>
	{/if}
</div>
