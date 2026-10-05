<script lang="ts">
	import { ModalDialog, Button, FormMessage } from '$lib/components/ui';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	let {
		file,
		open = $bindable(false),
		onUse
	}: { file: File | null; open?: boolean; onUse: (file: File) => void } = $props();
	let image = $state<HTMLImageElement>();
	let url = $state('');
	let width = $state(0);
	let height = $state(0);
	let zoom = $state(1);
	let x = $state(0);
	let y = $state(0);
	let saving = $state(false);
	let error = $state('');
	const side = 224;
	const scale = $derived(width && height ? Math.max(side / width, side / height) * zoom : 1);
	let drag: { id: number; x: number; y: number; startX: number; startY: number } | null = null;
	$effect(() => {
		if (!file) return;
		const objectUrl = URL.createObjectURL(file);
		url = objectUrl;
		width = 0;
		height = 0;
		zoom = 1;
		x = 0;
		y = 0;
		error = '';
		return () => URL.revokeObjectURL(objectUrl);
	});
	function clampPosition(nextX: number, nextY: number) {
		x = Math.max(-(width * scale - side) / 2, Math.min((width * scale - side) / 2, nextX));
		y = Math.max(-(height * scale - side) / 2, Math.min((height * scale - side) / 2, nextY));
	}
	async function usePhoto() {
		if (!image || !width || saving) return;
		saving = true;
		error = '';
		try {
			const canvas = document.createElement('canvas');
			canvas.width = 512;
			canvas.height = 512;
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Canvas unavailable');
			const cropSide = side / scale;
			context.drawImage(
				image,
				(width - cropSide) / 2 - x / scale,
				(height - cropSide) / 2 - y / scale,
				cropSide,
				cropSide,
				0,
				0,
				512,
				512
			);
			const blob = await new Promise<Blob>((resolve, reject) =>
				canvas.toBlob(
					(blob) => (blob ? resolve(blob) : reject(new Error('Photo unavailable'))),
					'image/png'
				)
			);
			onUse(new File([blob], 'profile-photo.png', { type: 'image/png' }));
			open = false;
		} catch {
			error = 'This photo could not be adjusted. Please choose another image.';
		} finally {
			saving = false;
		}
	}
</script>

<ModalDialog
	bind:open
	title="Adjust profile photo"
	description="Drag to position your photo, then zoom to find the right fit."
	class="w-[calc(100%-2rem)] p-4 sm:p-6"
>
	<div class="space-y-4">
		<!-- A photo crop surface supports pointer dragging and keyboard positioning. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			role="application"
			aria-label="Profile photo crop"
			aria-describedby="crop-help"
			tabindex="0"
			class="relative mx-auto size-56 touch-none overflow-hidden rounded-full border border-control-border bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent"
			onpointerdown={(event) => {
				if (!width || saving || !event.isPrimary || event.button !== 0) return;
				event.preventDefault();
				drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: x, startY: y };
				event.currentTarget.setPointerCapture(event.pointerId);
			}}
			onpointermove={(event) => {
				if (drag?.id === event.pointerId)
					clampPosition(drag.startX + event.clientX - drag.x, drag.startY + event.clientY - drag.y);
			}}
			onpointerup={() => (drag = null)}
			onpointercancel={() => (drag = null)}
			onlostpointercapture={() => (drag = null)}
			onkeydown={(event) => {
				const moves: Record<string, [number, number]> = {
					ArrowLeft: [-4, 0],
					ArrowRight: [4, 0],
					ArrowUp: [0, -4],
					ArrowDown: [0, 4]
				};
				if (width && !saving && moves[event.key]) {
					event.preventDefault();
					clampPosition(x + moves[event.key][0], y + moves[event.key][1]);
				}
			}}
		>
			{#if url && !width && !error}<div
					class="absolute inset-0"
					role="status"
					aria-label="Loading photo preview"
				>
					<Skeleton class="size-full rounded-full" /><span class="sr-only"
						>Loading photo preview...</span
					>
				</div>{/if}
			{#if url}<img
					bind:this={image}
					src={url}
					alt="Avatar adjustment"
					draggable="false"
					class="pointer-events-none absolute top-1/2 left-1/2 max-w-none select-none"
					style:width={`${width * scale}px`}
					style:height={`${height * scale}px`}
					style:transform={`translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`}
					onload={(event) => {
						const img = event.currentTarget as HTMLImageElement;
						width = img.naturalWidth;
						height = img.naturalHeight;
					}}
					onerror={() =>
						(error = 'This image could not be opened. Choose a JPEG, PNG or WebP photo.')}
				/>{/if}
		</div>
		<label class="block text-sm font-medium text-ink"
			>Zoom <span class="float-right text-xs text-muted">{zoom.toFixed(1)}x</span><input
				type="range"
				min="1"
				max="3"
				step="0.05"
				bind:value={zoom}
				oninput={() => {
					drag = null;
					requestAnimationFrame(() => clampPosition(x, y));
				}}
				disabled={saving || !width}
				class="block min-h-11 w-full accent-accent"
			/></label
		>
		<p id="crop-help" class="text-xs leading-5 text-muted">
			The circle previews your avatar. You can also use arrow keys to position it.
		</p>
		{#if error}<FormMessage type="error" message={error} />{/if}
	</div>
	{#snippet actions()}
		<Button variant="ghost" disabled={saving} onclick={() => (open = false)}>Cancel</Button>
		<Button loading={saving} disabled={saving || !width || Boolean(error)} onclick={usePhoto}
			>Use photo</Button
		>
	{/snippet}
</ModalDialog>
