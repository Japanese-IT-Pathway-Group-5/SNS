<script lang="ts">
	import { Button, Card, Badge } from '$lib/components/ui';
	import { Sparkles, Palette, ArrowRight } from '@lucide/svelte';
</script>

<svelte:head>
	<title>SNS — Everyday Journal</title>
</svelte:head>

<main class="mx-auto max-w-xl space-y-8 px-4 py-16 text-center">
	<div class="space-y-3">
		<div class="flex items-center justify-center gap-2">
			<Badge variant="lime">🌱 Group 5 Pilot</Badge>
			<Badge variant="peach">Everyday Journal</Badge>
		</div>
		<h1 class="text-3xl font-bold tracking-tight text-ink sm:text-4xl">SNS</h1>
		<p class="mx-auto max-w-md text-base leading-relaxed text-muted">
			"Your day doesn't have to be special to be worth sharing."
		</p>
	</div>

	<Card variant="surface" class="space-y-4 text-left">
		<div class="space-y-1">
			<h2 class="flex items-center gap-2 text-base font-bold text-ink">
				<Sparkles class="size-4 text-accent" />
				Foundation Ready!
			</h2>
			<p class="text-sm text-muted">
				The SvelteKit 5 + Cloudflare Workers scaffold and shared design system are live.
			</p>
		</div>

		<div class="flex flex-col items-stretch gap-2.5 pt-2 sm:flex-row sm:items-center">
			<Button variant="primary" href="/dev/components">
				<Palette class="size-4" />
				<span>Explore Component Showcase</span>
				<ArrowRight class="size-4" />
			</Button>
		</div>
	</Card>
</main>
