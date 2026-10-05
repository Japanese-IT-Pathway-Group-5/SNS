<script lang="ts">
	import { parseBanner, strokeColor, type Banner } from '$lib/validation/banner';
	let {
		value = '',
		drawing,
		stretch = false,
		label = 'Journal drawing banner'
	}: { value?: string | null; drawing?: Banner; label?: string; stretch?: boolean } = $props();
	const art = $derived(drawing ?? parseBanner(value));
</script>

<svg
	viewBox="0 0 800 320"
	preserveAspectRatio={stretch ? 'none' : 'xMidYMid meet'}
	class="h-full w-full rounded-xl bg-surface"
	role="img"
	aria-label={label}
>
	{#each art?.strokes ?? [] as stroke, index (index)}
		{#if stroke.points.length === 1}
			<circle
				cx={stroke.points[0][0]}
				cy={stroke.points[0][1]}
				r={stroke.size / 2}
				fill={strokeColor(stroke)}
				opacity={(stroke.opacity ?? 1) *
					(stroke.tool === 'marker' ? 0.35 : stroke.tool === 'pencil' ? 0.65 : 1)}
			/>
		{:else}
			<polyline
				points={stroke.points.map((point) => point.join(',')).join(' ')}
				fill="none"
				stroke={strokeColor(stroke)}
				stroke-width={stroke.size}
				stroke-linecap="round"
				stroke-linejoin="round"
				opacity={(stroke.opacity ?? 1) *
					(stroke.tool === 'marker' ? 0.35 : stroke.tool === 'pencil' ? 0.65 : 1)}
			/>
		{/if}
	{/each}
</svg>
