<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import House from '@lucide/svelte/icons/house';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import Settings from '@lucide/svelte/icons/settings';

	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';
	import type { User } from 'better-auth';

	let {
		user = null,
		mobile = false,
		collapsed = false,
		onToggle = () => {},
		onNavigate = () => {}
	}: {
		user?: User | null;
		mobile?: boolean;
		collapsed?: boolean;
		onToggle?: () => void;
		onNavigate?: () => void;
	} = $props();
	const homeActive = $derived(page.url.pathname === '/');
</script>

<aside
	class:mobile
	class:collapsed={collapsed && !mobile}
	class="sidebar flex h-full flex-col overflow-hidden border-r border-line bg-surface"
	aria-label="Sidebar"
>
	{#if !mobile}
		<div class="flex items-center justify-end border-b border-line p-2">
			<button
				type="button"
				onclick={onToggle}
				aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-expanded={!collapsed}
				aria-controls="desktop-sidebar-navigation"
				class="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				<span aria-hidden="true"
					><FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} class="size-5" /></span
				>
			</button>
		</div>
	{/if}
	<nav
		id={mobile ? undefined : 'desktop-sidebar-navigation'}
		aria-label="Sidebar navigation"
		class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2"
	>
		<a
			href={resolve('/')}
			onclick={onNavigate}
			aria-label="Home"
			title={collapsed && !mobile ? 'Home' : undefined}
			aria-current={homeActive ? 'page' : undefined}
			class:active={homeActive}
			class="nav-item"
		>
			<House class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span class="nav-label"
				>Home</span
			>
		</a>
		<a
			href={user ? resolve('/journal') : resolve('/login?redirectTo=%2Fjournal')}
			onclick={onNavigate}
			aria-label="My journal"
			title={collapsed && !mobile ? 'My journal' : undefined}
			aria-current={page.url.pathname === '/journal' ? 'page' : undefined}
			class:active={page.url.pathname === '/journal'}
			class="nav-item"
		>
			<NotebookPen class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span
				class="nav-label">My journal</span
			>
		</a>
		<div class="my-3 h-px bg-line" aria-hidden="true"></div>
		<a
			href={user ? resolve('/settings') : resolve('/login?redirectTo=%2Fsettings')}
			onclick={onNavigate}
			aria-label="Account and settings"
			title={collapsed && !mobile ? 'Account and settings' : undefined}
			aria-current={page.url.pathname === '/settings' ? 'page' : undefined}
			class:active={page.url.pathname === '/settings'}
			class="nav-item"
		>
			<Settings class="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span
				class="nav-label">Account &amp; settings</span
			>
		</a>
	</nav>
</aside>

<style>
	.sidebar {
		width: 100%;
	}
	.sidebar.collapsed .nav-item {
		padding-inline: 0.875rem;
	}
	.sidebar.collapsed .nav-label {
		display: none;
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
	.nav-item:hover {
		background: var(--color-surface-muted);
		color: var(--color-ink);
	}
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
