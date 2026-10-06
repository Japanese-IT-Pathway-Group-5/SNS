<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	let { pathname }: { pathname: string } = $props();
	let profile = $derived(
		pathname.endsWith('/journal') || /\/profile\/(?!edit(?:\/|$))[^/]+$/.test(pathname)
	);
	let form = $derived(pathname.endsWith('/settings') || pathname.endsWith('/profile/edit'));
</script>

<div class="space-y-6" role="status" aria-label="Loading page">
	<span class="sr-only">Loading page…</span>
	{#if profile}
		<Skeleton class="h-32 w-full rounded-xl sm:h-40" />
		<div class="flex items-center gap-4">
			<Skeleton class="size-20 rounded-full" />
			<div class="flex-1 space-y-3">
				<Skeleton class="h-6 w-32" /><Skeleton class="h-4 w-2/3" />
			</div>
		</div>
	{:else}
		<div class="space-y-3"><Skeleton class="h-7 w-40" /><Skeleton class="h-4 w-2/3" /></div>
	{/if}
	{#if form}
		<div class="space-y-6 rounded-xl border border-line bg-surface p-5">
			{#each [1, 2, 3] as row (row)}<div class="space-y-2">
					<Skeleton class="h-4 w-24" /><Skeleton class="h-11 w-full" />
				</div>{/each}
		</div>
	{:else}
		{#each [1, 2, 3] as row (row)}
			<div class="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
				<div class="flex items-center gap-3">
					<Skeleton class="size-10 rounded-full" /><Skeleton class="h-4 w-28" />
				</div>
				<Skeleton class="h-4 w-full" /><Skeleton class="h-4 w-4/5" /><Skeleton class="h-4 w-1/2" />
				<div class="border-t border-line pt-3"><Skeleton class="h-4 w-20" /></div>
			</div>
		{/each}
	{/if}
</div>
