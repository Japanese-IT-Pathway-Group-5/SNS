<script lang="ts">
	import { clearUserDraft } from '$lib/drafts/persistence';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getContext, onMount, type Snippet } from 'svelte';
	import { SIDEBAR_CONTEXT, type SidebarState } from '$lib/navigation/sidebar';
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
		rightRail,
		children
	}: {
		user?: User | null;
		createOpen?: boolean;
		rightRail?: Snippet;
		children: Snippet;
	} = $props();
	let mobileOpen = $state(false);
	const sidebarState = getContext<SidebarState>(SIDEBAR_CONTEXT);
	let sidebarResizing = $state(false);
	const minSidebarWidth = 192;
	const maxSidebarWidth = 320;
	const collapsedSidebarWidth = 64;
	const sidebarCollapseThreshold = 128;
	const sidebarPreferenceKey = 'claymore_sidebar_collapsed_v1';
	const sidebarWidthKey = 'claymore_sidebar_width_v1';
	let logoutForm = $state<HTMLFormElement>();
	let search = $derived(page.url.searchParams.get('q') ?? '');
	$effect(() => {
		if (user && page.url.searchParams.get('compose') === '1') createOpen = true;
	});
	onMount(() => {
		if (!sidebarState.restored) {
			try {
				sidebarState.collapsed = localStorage.getItem(sidebarPreferenceKey) === 'true';
				const savedWidth = Number(localStorage.getItem(sidebarWidthKey));
				if (
					Number.isFinite(savedWidth) &&
					savedWidth >= minSidebarWidth &&
					savedWidth <= maxSidebarWidth
				) {
					sidebarState.width = savedWidth;
				}
			} catch {
				// Navigation still works when browser storage is unavailable.
			}
			sidebarState.restored = true;
		}
		const desktop = window.matchMedia('(min-width: 768px)');
		const closeDrawer = () => {
			if (desktop.matches) mobileOpen = false;
		};
		desktop.addEventListener('change', closeDrawer);
		return () => desktop.removeEventListener('change', closeDrawer);
	});
	function toggleSidebar() {
		sidebarState.collapsed = !sidebarState.collapsed;
		saveSidebarPreference();
	}
	function saveSidebarPreference() {
		try {
			localStorage.setItem(sidebarPreferenceKey, String(sidebarState.collapsed));
			localStorage.setItem(sidebarWidthKey, String(sidebarState.width));
		} catch {
			// Resizing remains available without persistent browser storage.
		}
	}
	function resizeSidebar(width: number) {
		sidebarState.collapsed = width < sidebarCollapseThreshold;
		if (sidebarState.collapsed) return;
		sidebarState.width = Math.round(Math.min(maxSidebarWidth, Math.max(minSidebarWidth, width)));
	}
	function startSidebarResize(event: PointerEvent) {
		if (event.button !== 0 || !event.isPrimary) return;
		event.preventDefault();
		const handle = event.currentTarget as HTMLElement;
		handle.setPointerCapture(event.pointerId);
		sidebarResizing = true;
	}
	function moveSidebarResize(event: PointerEvent) {
		if (sidebarResizing) resizeSidebar(event.clientX);
	}
	function finishSidebarResize() {
		if (!sidebarResizing) return;
		sidebarResizing = false;
		saveSidebarPreference();
	}
	function keyboardSidebarResize(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			toggleSidebar();
			return;
		}
		const widths: Record<string, number> = {
			ArrowLeft:
				sidebarState.collapsed || sidebarState.width === minSidebarWidth
					? collapsedSidebarWidth
					: sidebarState.width - 16,
			ArrowRight: sidebarState.collapsed ? sidebarState.width : sidebarState.width + 16,
			Home: collapsedSidebarWidth,
			End: maxSidebarWidth
		};
		if (!(event.key in widths)) return;
		event.preventDefault();
		resizeSidebar(widths[event.key]);
		saveSidebarPreference();
	}

	function createPost() {
		mobileOpen = false;
		if (user) createOpen = true;
		else void goto(resolve(`/login?redirectTo=${encodeURIComponent('/?compose=1')}`));
	}
</script>

<div
	class="app-shell min-h-svh bg-canvas"
	class:sidebar-resizing={sidebarResizing}
	style:--sidebar-width={sidebarState.collapsed ? '4rem' : `${sidebarState.width}px`}
	style:--sidebar-transition={sidebarResizing ? '0ms' : '160ms'}
>
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
					onNavigate={() => {
						mobileOpen = false;
					}}
				/>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
	<div class="desktop-sidebar fixed bottom-0 left-0 z-30 hidden md:block">
		<Sidebar {user} collapsed={sidebarState.collapsed} onToggle={toggleSidebar} />
		<!-- A focusable ARIA separator is an interactive splitter (WAI-ARIA window splitter pattern). -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			role="separator"
			tabindex="0"
			aria-label="Resize sidebar"
			aria-orientation="vertical"
			aria-valuemin={collapsedSidebarWidth}
			aria-valuemax={maxSidebarWidth}
			aria-valuenow={sidebarState.collapsed ? collapsedSidebarWidth : sidebarState.width}
			aria-valuetext={sidebarState.collapsed ? 'Collapsed' : `${sidebarState.width} pixels wide`}
			aria-controls="desktop-sidebar-navigation"
			title="Drag to resize. Use arrow keys when focused."
			class="sidebar-resize-handle"
			onpointerdown={startSidebarResize}
			onpointermove={moveSidebarResize}
			onpointerup={finishSidebarResize}
			onpointercancel={finishSidebarResize}
			onlostpointercapture={finishSidebarResize}
			onkeydown={keyboardSidebarResize}
		></div>
	</div>
	<div class="shell-content">
		<div
			class="mx-auto grid max-w-2xl items-start gap-8 px-4 pt-7 pb-12 sm:px-6 sm:pt-9 sm:pb-16 xl:max-w-6xl xl:grid-cols-[minmax(0,1fr)_18rem]"
		>
			<div class="shell-reading w-full max-w-2xl min-w-0 justify-self-center">
				{@render children()}
			</div>
			{#if rightRail}{@render rightRail()}{/if}
		</div>
	</div>
</div>

{#if user}
	<ModalDialog
		bind:open={createOpen}
		title="Share a moment"
		description="A few words, one photo, or a little of both."
		fullscreenOnMobile
		class="max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-y-auto bg-canvas p-0"
		headerClass="overflow-hidden rounded-t-xl bg-accent p-5 text-on-accent max-sm:rounded-none max-sm:pt-[max(1.25rem,env(safe-area-inset-top))] sm:p-6"
	>
		{#snippet headerArtwork()}
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 hidden grid-cols-4 opacity-[0.14] sm:grid"
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
	.sidebar-resize-handle {
		position: absolute;
		inset-block: 0;
		right: -6px;
		width: 12px;
		cursor: col-resize;
		touch-action: none;
	}
	.sidebar-resize-handle:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
	.sidebar-resizing .sidebar-resize-handle:focus-visible {
		outline: none;
	}
	.app-shell.sidebar-resizing {
		cursor: col-resize;
		user-select: none;
	}
	.navbar {
		grid-template-columns: minmax(0, 1fr) auto;
	}
	.navbar-search {
		grid-column: 1 / -1;
		grid-row: 2;
	}
	.desktop-sidebar {
		top: 8.75rem;
		width: var(--sidebar-width);
		transition: width var(--sidebar-transition) ease;
	}
	@media (min-width: 768px) {
		.shell-content {
			padding-left: var(--sidebar-width);
			transition: padding-left var(--sidebar-transition) ease;
		}
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
	@media (prefers-reduced-motion: reduce) {
		.desktop-sidebar,
		.shell-content {
			transition: none;
		}
	}
</style>
