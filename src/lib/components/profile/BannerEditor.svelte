<script lang="ts">
	import { untrack } from 'svelte';
	import { Button, ModalDialog, FormMessage } from '$lib/components/ui';
	import BannerArtwork from './BannerArtwork.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faPaintbrush,
		faPen,
		faPencil,
		faHighlighter,
		faEraser,
		faArrowsUpDown,
		faHand,
		faMagnifyingGlassPlus,
		faMagnifyingGlassMinus
	} from '@fortawesome/free-solid-svg-icons';
	const toolIcons = { pen: faPen, pencil: faPencil, marker: faHighlighter, eraser: faEraser };
	import {
		parseBanner,
		bannerColors,
		bannerTools,
		MAX_BANNER_POINTS,
		MAX_BANNER_STROKES,
		type BannerStroke
	} from '$lib/validation/banner';
	let { value = $bindable(''), disabled = false }: { value?: string; disabled?: boolean } =
		$props();
	let open = $state(false);
	let strokes = $state<BannerStroke[]>([]);
	let redo = $state<BannerStroke[][]>([]);
	let undo = $state<BannerStroke[][]>([]);
	let active = $state<BannerStroke | null>(null);
	let pointerId: number | null = null;
	let tool = $state<BannerStroke['tool']>('pen');
	let color = $state('accent');
	let size = $state(5);
	let opacity = $state(100);
	let message = $state('');
	let keyboardPoint = $state<[number, number]>([400, 160]);
	let cursorPoint = $state<[number, number]>([400, 160]);
	let cursorVisible = $state(false);
	let zoomed = $state(false);
	let movingCanvas = $state(false);
	let viewport = $state<HTMLDivElement>();
	let artLayer = $state<HTMLDivElement>();
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let panStart: { x: number; y: number; left: number; top: number; pointer: number } | null = null;
	const drawing = $derived({
		version: 1 as const,
		strokes: active ? [...strokes, active] : strokes
	});
	const pointCount = $derived(strokes.reduce((count, stroke) => count + stroke.points.length, 0));
	function beginEditing() {
		strokes = structuredClone(untrack(() => parseBanner(value)?.strokes ?? []));
		undo = [];
		redo = [];
		active = null;
		message = '';
		zoomed = false;
		movingCanvas = false;
		panStart = null;
		zoom = 1;
		panX = 0;
		panY = 0;
		cursorVisible = false;
		open = true;
	}
	function checkpoint() {
		undo = [...undo.slice(-29), structuredClone($state.snapshot(strokes))];
		redo = [];
	}
	function start(point: [number, number]) {
		if (strokes.length >= MAX_BANNER_STROKES || pointCount >= MAX_BANNER_POINTS) {
			message = 'This canvas is full. Undo a stroke or clear it to keep drawing.';
			return;
		}
		message = '';
		active = { tool, color, size, opacity: opacity / 100, points: [point] };
	}
	function finish() {
		panStart = null;
		if (!active) return;
		checkpoint();
		strokes = [...strokes, active];
		active = null;
		pointerId = null;
	}
	function coordinates(event: PointerEvent): [number, number] {
		const rect = (artLayer ?? (event.currentTarget as HTMLElement)).getBoundingClientRect();
		return [
			Math.round(Math.max(0, Math.min(800, ((event.clientX - rect.left) / rect.width) * 800))),
			Math.round(Math.max(0, Math.min(320, ((event.clientY - rect.top) / rect.height) * 320)))
		];
	}
	function moveArt(x: number, y: number) {
		if (!viewport) return;
		panX = Math.min(0, Math.max(-viewport.clientWidth * (zoom - 1), x));
		panY = Math.min(0, Math.max(-viewport.clientHeight * (zoom - 1), y));
	}
	function changeZoom(amount: number) {
		finish();
		const previous = zoom;
		zoom = Math.max(1, Math.min(3, zoom + amount));
		if (viewport)
			moveArt(
				((panX - viewport.clientWidth / 2) * zoom) / previous + viewport.clientWidth / 2,
				((panY - viewport.clientHeight / 2) * zoom) / previous + viewport.clientHeight / 2
			);
		if (zoom === 1) movingCanvas = false;
	}
	function pointerDown(event: PointerEvent) {
		if (!event.isPrimary || event.button !== 0 || active) return;
		event.preventDefault();
		cursorPoint = coordinates(event);
		cursorVisible = true;
		if (movingCanvas && viewport) {
			panStart = {
				x: event.clientX,
				y: event.clientY,
				left: panX,
				top: panY,
				pointer: event.pointerId
			};
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
			return;
		}
		start(coordinates(event));
		if (active) {
			pointerId = event.pointerId;
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		}
	}
	function pointerMove(event: PointerEvent) {
		if (event.isPrimary) {
			cursorPoint = coordinates(event);
			cursorVisible = true;
		}
		if (panStart && panStart.pointer === event.pointerId && viewport) {
			moveArt(
				panStart.left + event.clientX - panStart.x,
				panStart.top + event.clientY - panStart.y
			);
			return;
		}
		if (!active || pointerId !== event.pointerId) return;
		if (pointCount + active.points.length >= MAX_BANNER_POINTS) {
			message = 'Canvas limit reached. Undo or clear to keep drawing.';
			return;
		}
		const point = coordinates(event);
		const last = active.points.at(-1)!;
		if (point[0] !== last[0] || point[1] !== last[1]) active.points = [...active.points, point];
	}
	function keyDraw(event: KeyboardEvent) {
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-8, 0],
			ArrowRight: [8, 0],
			ArrowUp: [0, -8],
			ArrowDown: [0, 8]
		};
		if (event.key === ' ') {
			event.preventDefault();
			if (movingCanvas) return;
			if (active) finish();
			else start([...keyboardPoint]);
			return;
		}
		if (!moves[event.key]) return;
		event.preventDefault();
		if (movingCanvas && viewport) {
			moveArt(panX + moves[event.key][0] * 4, panY + moves[event.key][1] * 4);
			return;
		}
		keyboardPoint = [
			Math.max(0, Math.min(800, keyboardPoint[0] + moves[event.key][0])),
			Math.max(0, Math.min(320, keyboardPoint[1] + moves[event.key][1]))
		];
		cursorPoint = [...keyboardPoint];
		cursorVisible = true;
		if (active && pointCount + active.points.length < MAX_BANNER_POINTS)
			active.points = [...active.points, [...keyboardPoint]];
	}
</script>

<input type="hidden" name="banner" {value} />
<div class="mt-4 h-28 overflow-hidden rounded-xl sm:h-32">
	<BannerArtwork
		{value}
		label={value ? 'Your banner drawing preview' : 'Empty banner drawing preview'}
	/>
</div>
<div class="mt-3 flex flex-wrap gap-2">
	<Button size="sm" variant="secondary" onclick={beginEditing} {disabled}
		><span aria-hidden="true"><FontAwesomeIcon icon={faPaintbrush} class="size-3.5" /></span>{value
			? 'Edit drawing'
			: 'Draw your banner'}</Button
	>
	{#if value}<Button size="sm" variant="ghost" onclick={() => (value = '')} {disabled}
			>Remove banner</Button
		>{/if}
</div>
<p class="mt-2 text-xs leading-5 text-muted">
	Draw something that feels like you. Your banner is visible to everyone.
</p>

<ModalDialog
	bind:open
	title="Draw your banner"
	description="A little canvas for ordinary inspiration."
	fullscreenOnMobile
	class="max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-x-hidden overflow-y-auto p-4 sm:p-6"
>
	<div class="w-full max-w-full min-w-0 space-y-3 sm:space-y-4">
		<div class="grid grid-cols-4 gap-2" role="group" aria-label="Drawing tools">
			{#each bannerTools as item (item)}<Button
					size="sm"
					variant={tool === item ? 'primary' : 'secondary'}
					aria-pressed={tool === item}
					class="min-h-14 flex-col gap-1 px-2 py-2 text-xs"
					onclick={() => {
						finish();
						tool = item;
					}}
					><span aria-hidden="true"><FontAwesomeIcon icon={toolIcons[item]} class="size-5" /></span
					>{item[0].toUpperCase() + item.slice(1)}</Button
				>{/each}
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<div class="flex flex-wrap gap-1" role="group" aria-label="Drawing colors">
				{#each bannerColors as item (item)}<button
						type="button"
						aria-label={`${item} color`}
						aria-pressed={color === item}
						onclick={() => (color = item)}
						class="flex size-9 items-center justify-center rounded-lg border border-control-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						class:ring-2={color === item}
						class:ring-accent={color === item}
						><span
							class="size-5 rounded-full border border-line"
							style:background={`var(--color-${item})`}
						></span></button
					>{/each}
			</div>
			<label class="flex items-center gap-2 text-sm text-ink"
				>Custom color<input
					type="color"
					value={color.startsWith('#') ? color : '#326b66'}
					oninput={(event) => (color = event.currentTarget.value)}
					class="size-9 rounded border border-control-border"
				/></label
			>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<label class="min-w-0 text-sm text-ink">
				<span class="flex items-center justify-between gap-2"
					>Size <span class="text-xs text-muted tabular-nums">{size} px</span></span
				>
				<input
					type="range"
					min="1"
					max="32"
					step="1"
					bind:value={size}
					aria-label="Brush size"
					aria-valuetext={`${size} pixels`}
					class="block min-h-11 w-full cursor-pointer accent-accent"
				/>
			</label>
			<label class="min-w-0 text-sm text-ink">
				<span class="flex items-center justify-between gap-2"
					>Opacity <span class="text-xs text-muted tabular-nums">{opacity}%</span></span
				>
				<input
					type="range"
					min="1"
					max="100"
					step="1"
					bind:value={opacity}
					aria-label="Brush opacity"
					aria-valuetext={`${opacity} percent`}
					class="block min-h-11 w-full cursor-pointer accent-accent"
				/>
			</label>
		</div>
		<div class="flex flex-wrap gap-2 sm:hidden">
			<Button
				size="sm"
				variant={zoomed ? 'primary' : 'secondary'}
				class="size-11 p-0"
				aria-label={zoomed ? 'Restore canvas height' : 'Enlarge canvas height'}
				title={zoomed ? 'Restore canvas height' : 'Enlarge canvas height'}
				aria-pressed={zoomed}
				onclick={() => {
					finish();
					zoomed = !zoomed;
					movingCanvas = false;
					zoom = 1;
					panX = 0;
					panY = 0;
				}}
				><span aria-hidden="true"><FontAwesomeIcon icon={faArrowsUpDown} class="size-5" /></span
				></Button
			>
			<Button
				size="sm"
				variant="secondary"
				class="size-11 p-0"
				aria-label="Zoom in drawing"
				title="Zoom in drawing"
				disabled={zoom >= 3}
				onclick={() => changeZoom(0.5)}
				><span aria-hidden="true"
					><FontAwesomeIcon icon={faMagnifyingGlassPlus} class="size-5" /></span
				></Button
			>
			<Button
				size="sm"
				variant="secondary"
				class="size-11 p-0"
				aria-label="Zoom out drawing"
				title="Zoom out drawing"
				disabled={zoom <= 1}
				onclick={() => changeZoom(-0.5)}
				><span aria-hidden="true"
					><FontAwesomeIcon icon={faMagnifyingGlassMinus} class="size-5" /></span
				></Button
			>
			<Button
				size="sm"
				variant={movingCanvas ? 'primary' : 'secondary'}
				class="size-11 p-0"
				aria-label="Move canvas"
				title="Move canvas"
				disabled={zoom <= 1}
				aria-pressed={movingCanvas}
				onclick={() => {
					finish();
					movingCanvas = !movingCanvas;
				}}><span aria-hidden="true"><FontAwesomeIcon icon={faHand} class="size-5" /></span></Button
			>
		</div>
		<div
			bind:this={viewport}
			class="drawing-viewport relative aspect-[5/2] overflow-hidden rounded-xl border border-control-border bg-surface focus-within:ring-2 focus-within:ring-accent"
			class:zoomed
		>
			<!-- A keyboard-operable drawing surface, with arrow/space input explained below. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
			<div
				role="application"
				aria-label="Banner drawing canvas"
				aria-describedby="drawing-keyboard-help"
				tabindex="0"
				class="drawing-surface absolute inset-0 touch-none overflow-hidden bg-surface outline-none"
				class:cursor-grab={movingCanvas}
				onpointerdown={pointerDown}
				onpointerenter={(event) => {
					cursorPoint = coordinates(event);
					cursorVisible = true;
				}}
				onpointerleave={() => {
					if (!active) cursorVisible = false;
				}}
				onpointermove={pointerMove}
				onpointerup={(event) => {
					finish();
					cursorVisible = event.pointerType === 'mouse';
				}}
				onpointercancel={() => {
					finish();
					cursorVisible = false;
				}}
				onlostpointercapture={finish}
				onkeydown={keyDraw}
				onblur={() => {
					finish();
					cursorVisible = false;
				}}
			>
				<div
					bind:this={artLayer}
					class="absolute inset-0 origin-top-left"
					style:transform={`translate(${panX}px, ${panY}px) scale(${zoom})`}
				>
					<BannerArtwork {drawing} stretch={zoomed} label="Drawing in progress" />
					{#if tool === 'eraser' && cursorVisible && !movingCanvas}
						<svg
							class="pointer-events-none absolute inset-0 h-full w-full"
							viewBox="0 0 800 320"
							preserveAspectRatio={zoomed ? 'none' : 'xMidYMid meet'}
							aria-hidden="true"
						>
							<circle
								cx={cursorPoint[0]}
								cy={cursorPoint[1]}
								r={size / 2}
								fill="none"
								stroke="var(--color-surface)"
								stroke-width="4"
								vector-effect="non-scaling-stroke"
							/>
							<circle
								cx={cursorPoint[0]}
								cy={cursorPoint[1]}
								r={size / 2}
								fill="var(--color-accent-soft)"
								fill-opacity="0.25"
								stroke="var(--color-accent)"
								stroke-width="1.5"
								vector-effect="non-scaling-stroke"
							/>
						</svg>
					{:else if tool !== 'eraser'}
						<span
							aria-hidden="true"
							class="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink"
							style:left={`${keyboardPoint[0] / 8}%`}
							style:top={`${keyboardPoint[1] / 3.2}%`}
						></span>
					{/if}
				</div>
			</div>
		</div>
		<p id="drawing-keyboard-help" class="sr-only text-xs leading-5 text-muted sm:not-sr-only">
			Draw with a mouse, touch or stylus. Keyboard: arrows move the cursor; Space starts or finishes
			a stroke. On mobile, use Move canvas to drag to another area, then turn it off to draw.
		</p>
		<p class="text-xs leading-5 text-muted sm:hidden">
			{zoom > 1
				? 'Use the hand to move within the drawing. Switch it off to draw.'
				: 'Arrows make the canvas taller. Magnifiers zoom into the drawing.'}
		</p>
		<div class="flex flex-wrap gap-2">
			<Button
				size="sm"
				variant="secondary"
				disabled={!undo.length || Boolean(active)}
				onclick={() => {
					redo = [...redo, structuredClone($state.snapshot(strokes))];
					strokes = undo.at(-1)!;
					undo = undo.slice(0, -1);
					message = '';
				}}>Undo</Button
			>
			<Button
				size="sm"
				variant="secondary"
				disabled={!redo.length || Boolean(active)}
				onclick={() => {
					undo = [...undo, structuredClone($state.snapshot(strokes))];
					strokes = redo.at(-1)!;
					redo = redo.slice(0, -1);
					message = '';
				}}>Redo</Button
			>
			<Button
				size="sm"
				variant="ghost"
				disabled={!strokes.length && !active}
				onclick={() => {
					finish();
					checkpoint();
					strokes = [];
					message = '';
				}}>Clear canvas</Button
			>
		</div>
		{#if message}<FormMessage type="error" {message} />{/if}
	</div>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
		<Button
			onclick={() => {
				finish();
				value = strokes.length ? JSON.stringify({ version: 1, strokes }) : '';
				open = false;
			}}>Use drawing</Button
		>
	{/snippet}
</ModalDialog>

<style>
	.drawing-surface {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
	}
	.drawing-viewport {
		width: 100%;
		max-width: 100%;
		min-width: 0;
		contain: inline-size;
	}
	@media (max-width: 639px) {
		.drawing-viewport.zoomed {
			height: 40svh;
			min-height: 16rem;
			aspect-ratio: auto;
		}
	}
</style>
