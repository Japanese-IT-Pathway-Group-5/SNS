<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Button from './Button.svelte';
	let {
		href,
		label = 'Go back',
		class: className = ''
	}: { href: string; label?: string; class?: string } = $props();
</script>

<Button variant="link" size="sm" {href} class={`min-h-11 px-2 ${className}`}>
	<ChevronLeft class="me-1 size-4 opacity-60" strokeWidth={2} aria-hidden="true" />
	{label}
</Button>
