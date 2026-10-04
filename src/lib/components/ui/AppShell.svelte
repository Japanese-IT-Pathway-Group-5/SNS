<script lang="ts">
	import { clearUserDraft } from '$lib/drafts/persistence';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick, type Snippet } from 'svelte';
	import { Dialog, DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Menu from '@lucide/svelte/icons/menu';
	import UserRound from '@lucide/svelte/icons/user-round';
	import X from '@lucide/svelte/icons/x';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Settings from '@lucide/svelte/icons/settings';
	import LogOut from '@lucide/svelte/icons/log-out';
	import type { User } from 'better-auth';
	import { MAX_SEARCH_LENGTH } from '$lib/validation/search';
	import Avatar from './Avatar.svelte';
	import Sidebar from './Sidebar.svelte';
	import ModalDialog from './ModalDialog.svelte';
	import Composer from '../posts/Composer.svelte';

	let {
		user = null,
		createOpen = $bindable(false),
		children
	}: { user?: User | null; createOpen?: boolean; children: Snippet } = $props();
	let mobileOpen = $state(false);
	let logoutForm = $state<HTMLFormElement>();
	let searchInput = $state<HTMLInputElement>();
	let search = $derived(page.url.searchParams.get('q') ?? '');
	$effect(() => {
		if (user && page.url.searchParams.get('compose') === '1') createOpen = true;
	});
	onMount(() => {
		const desktop = window.matchMedia('(min-width: 768px)');
		const closeDrawer = () => {
			if (desktop.matches) mobileOpen = false;
		};
		desktop.addEventListener('change', closeDrawer);
		return () => desktop.removeEventListener('change', closeDrawer);
	});

	function createPost() {
		mobileOpen = false;
		if (user) createOpen = true;
		else void goto(resolve(`/login?redirectTo=${encodeURIComponent('/?compose=1')}`));
	}
	async function focusSearch() {
		mobileOpen = false;
		await tick();
		searchInput?.focus();
	}
</script>

<div class="min-h-svh bg-canvas">
	<Dialog.Root bind:open={mobileOpen}>
		<header class="sticky top-0 z-40 bg-accent text-on-accent">
			<div class="navbar relative grid items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
				<div class="flex min-w-0 items-center gap-2">
					<Dialog.Trigger
						aria-label="Open navigation"
						class="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-on-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent md:hidden"
						><Menu class="size-5" strokeWidth={1.75} aria-hidden="true" /></Dialog.Trigger
					>
					<a
						href={resolve('/')}
						aria-label="Claymore home"
						class="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-accent"
					>
						<img
							src="/logo.svg"
							alt=""
							class="size-11 shrink-0 brightness-0 invert sm:size-12"
						/><span class="text-lg font-semibold tracking-tight sm:text-xl">Claymore</span>
					</a>
				</div>
				<form
					role="search"
					aria-label="Search public posts"
					method="GET"
					action={resolve('/')}
					class="navbar-search relative w-full"
				>
					<input
						id="nav-search"
						bind:this={searchInput}
						bind:value={search}
						name="q"
						type="search"
						maxlength={MAX_SEARCH_LENGTH}
						autocomplete="off"
						placeholder="Search moments…"
						aria-label="Search moments"
						class="min-h-11 w-full rounded-lg border border-on-accent/40 bg-surface py-2.5 pr-12 pl-4 text-sm text-ink placeholder:text-muted focus:bg-accent-soft focus:outline-2 focus:outline-offset-2 focus:outline-on-accent"
					/>
					<button
						type="submit"
						aria-label="Search"
						class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						><Search class="size-5" strokeWidth={1.75} aria-hidden="true" /></button
					>
				</form>
				<nav aria-label="Account and posting" class="flex items-center justify-end gap-2 sm:gap-3">
					<button
						type="button"
						aria-label="Create a post"
						title="Create a post"
						onclick={createPost}
						class="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-on-accent/40 px-3 hover:outline-2 hover:outline-offset-2 hover:outline-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
						><SquarePen class="size-5" strokeWidth={1.75} aria-hidden="true" /><span
							class="hidden text-sm font-semibold xl:inline">Create post</span
						></button
					>
					{#if user}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								aria-label="User menu"
								class="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-accent"
								><Avatar name={user.name} src={user.image} size="md" /><span
									class="hidden items-center gap-1 lg:inline-flex"
									><span class="max-w-28 truncate text-sm font-semibold">{user.name}</span
									><ChevronDown
										class="size-3.5 opacity-70"
										strokeWidth={2}
										aria-hidden="true"
									/></span
								></DropdownMenu.Trigger
							>
							<DropdownMenu.Content
								class="z-50 min-w-48 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
								sideOffset={8}
								align="end"
							>
								<DropdownMenu.Item>
									{#snippet child({ props })}
										<a
											href={resolve('/settings')}
											{...props}
											class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink outline-none data-[highlighted]:bg-accent-soft data-[highlighted]:text-accent"
										>
											<Settings class="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
											<span>Account &amp; settings</span>
										</a>
									{/snippet}
								</DropdownMenu.Item>
								<DropdownMenu.Separator class="my-1 h-px bg-line" />
								<DropdownMenu.Item
									class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink outline-none data-[highlighted]:bg-accent-soft data-[highlighted]:text-accent"
									onSelect={() => logoutForm?.requestSubmit()}
								>
									<LogOut class="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
									<span>Sign out</span>
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						<form
							bind:this={logoutForm}
							method="POST"
							action={resolve('/logout')}
							class="hidden"
							onsubmit={() => {
								if (user?.id) {
									clearUserDraft(user.id);
								}
							}}
						></form>
					{:else}
						<a
							href={resolve('/login')}
							class="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
							><UserRound class="size-5" strokeWidth={1.75} aria-hidden="true" /><span
								class="hidden sm:inline">Sign in</span
							><span class="sr-only sm:hidden">Sign in</span></a
						>
					{/if}
				</nav>
			</div>
		</header>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 z-50 bg-ink/40" />
			<Dialog.Content
				class="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-3rem))] flex-col bg-surface focus:outline-none"
			>
				<div class="flex items-center justify-between border-b border-line p-4">
					<Dialog.Title class="text-lg font-semibold text-ink">Claymore</Dialog.Title><Dialog.Close
						aria-label="Close navigation"
						class="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
						><X class="size-5" strokeWidth={1.75} aria-hidden="true" /></Dialog.Close
					>
				</div>
				<Dialog.Description class="sr-only"
					>Browse the feed, find moments, or manage your account.</Dialog.Description
				>
				<Sidebar
					{user}
					mobile
					onCreatePost={createPost}
					onSearch={focusSearch}
					onNavigate={() => {
						mobileOpen = false;
					}}
				/>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
	<div class="desktop-sidebar fixed bottom-0 left-0 z-30 hidden md:block">
		<Sidebar {user} onCreatePost={createPost} onSearch={focusSearch} />
	</div>
	<div class="md:pl-60">{@render children()}</div>
</div>

{#if user}
	<ModalDialog
		bind:open={createOpen}
		title="Share a moment"
		description="A few words, one photo, or a little of both."
		class="max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-y-auto bg-canvas p-0"
		headerClass="overflow-hidden rounded-t-xl bg-accent p-5 text-on-accent sm:p-6"
	>
		{#snippet headerArtwork()}
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 grid grid-cols-4 opacity-[0.14]"
			>
				{#each ['/art/reading.svg', '/art/swinging.svg', '/art/dancing.svg', '/art/sitting-reading.svg'] as art (art)}
					<img src={art} alt="" class="h-full min-h-0 w-full object-contain" />
				{/each}
			</div>
		{/snippet}
		{#key user.id}
			<Composer {user} />
		{/key}
	</ModalDialog>
{/if}

<style>
	.navbar {
		grid-template-columns: minmax(0, 1fr) auto;
	}
	.navbar-search {
		grid-column: 1 / -1;
		grid-row: 2;
	}
	.desktop-sidebar {
		top: 8.75rem;
	}
	@media (min-width: 768px) {
		.navbar {
			min-height: 5rem;
			grid-template-columns: minmax(12rem, 1fr) minmax(12rem, 36rem) minmax(8rem, 1fr);
		}
		.navbar-search {
			grid-column: 2;
			grid-row: 1;
		}
		.desktop-sidebar {
			top: 5rem;
		}
	}
</style>
