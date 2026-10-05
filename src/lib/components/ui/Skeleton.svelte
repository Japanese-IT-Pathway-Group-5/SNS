<script lang="ts">
	import { cn } from '$lib/utils';
	let { class: className }: { class?: string } = $props();
</script>

<div aria-hidden="true" class={cn('skeleton rounded-md bg-surface-muted', className)}></div>

<style>
	.skeleton { animation: breathe 1.8s ease-in-out infinite; }
	@keyframes breathe { 50% { opacity: 0.5; } }
	@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }
	:global(.reduce-motion) .skeleton { animation: none; }
</style>
