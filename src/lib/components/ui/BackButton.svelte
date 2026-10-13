<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { getUiPreferences, t } from '$lib/preferences/ui';
	import Button from './Button.svelte';
	const ui = getUiPreferences();
	let {
		href,
		label,
		class: className = ''
	}: { href: string; label?: string; class?: string } = $props();
</script>

<Button variant="link" size="sm" {href} class={`min-h-11 px-2 ${className}`}>
	<ChevronLeft class="me-1 size-4 opacity-60" strokeWidth={2} aria-hidden="true" />
	{label ?? t(ui, 'common.goBack')}
</Button>
