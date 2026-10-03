<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import House from '@lucide/svelte/icons/house';
	import Search from '@lucide/svelte/icons/search';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Settings from '@lucide/svelte/icons/settings';
	import LogIn from '@lucide/svelte/icons/log-in';
	import type { User } from 'better-auth';
	import Avatar from './Avatar.svelte';

	let {
		user = null,
		mobile = false,
		onCreatePost,
		onSearch,
		onNavigate = () => {}
	}: {
		user?: User | null;
		mobile?: boolean;
		onCreatePost: () => void;
		onSearch: () => void;
		onNavigate?: () => void;
	} = $props();
	const homeActive = $derived(page.url.pathname === '/' && !page.url.searchParams.get('q'));
	const searchActive = $derived(page.url.pathname === '/' && !!page.url.searchParams.get('q'));
</script>

<aside
	class:mobile
	class="sidebar flex h-full flex-col overflow-hidden border-r border-line bg-surface"
	aria-label="Sidebar"
>
	<nav
		aria-label="Sidebar navigation"
		class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2"
	>
		<a
			href={resolve('/')}
			onclick={onNavigate}
			aria-label="Home"
			aria-current={homeActive ? 'page' : undefined}
			class:active={homeActive}
			class="nav-item"
		>
			<House class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span class="nav-label"
				>Home</span
			>
		</a>
		<button
			type="button"
			onclick={onSearch}
			aria-label="Search moments"
			class:active={searchActive}
			class="nav-item"
		>
			<Search class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span
				class="nav-label">Search moments</span
			>
		</button>
		<button type="button" onclick={onCreatePost} aria-label="Create a post" class="nav-item">
			<SquarePen class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span
				class="nav-label">Create a post</span
			>
		</button>
		<div class="my-3 h-px bg-line" aria-hidden="true"></div>
		<a
			href={user ? resolve('/settings') : resolve('/login?redirectTo=%2Fsettings')}
			onclick={onNavigate}
			aria-label="Account and settings"
			aria-current={page.url.pathname === '/settings' ? 'page' : undefined}
			class:active={page.url.pathname === '/settings'}
			class="nav-item"
		>
			<Settings class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span
				class="nav-label">Account &amp; settings</span
			>
		</a>
	</nav>
	<div class="border-t border-line p-2">
		{#if user}
			<a
				href={resolve('/settings')}
				onclick={onNavigate}
				aria-label="Your profile and settings"
				class="nav-item min-h-14"
			>
				<Avatar name={user.name} src={user.image} size="sm" class="-ml-1.5" />
				<span class="nav-label min-w-0"
					><span class="block truncate font-semibold">{user.name}</span><span
						class="block text-xs text-muted">Your account</span
					></span
				>
			</a>
		{:else}
			<a href={resolve('/login')} onclick={onNavigate} aria-label="Sign in" class="nav-item">
				<LogIn class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span
					class="nav-label">Sign in</span
				>
			</a>
		{/if}
	</div>
</aside>

<style>
	.sidebar {
		width: 15rem;
	}
	.nav-item {
		display: flex;
		min-height: 2.75rem;
		align-items: center;
		gap: 0.875rem;
		border-radius: 0.5rem;
		padding: 0.625rem 0.875rem;
		color: var(--color-muted);
		text-align: left;
		font-size: 0.875rem;
		white-space: nowrap;
	}
	.nav-item:hover,
	.nav-item.active {
		background: var(--color-accent-soft);
		color: var(--color-accent);
	}
	.nav-item.active {
		font-weight: 600;
	}
	.nav-item:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
	.nav-label {
		overflow: hidden;
	}
	.sidebar.mobile {
		width: 100%;
		border-right: 0;
	}
</style>
