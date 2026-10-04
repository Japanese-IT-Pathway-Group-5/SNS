<script lang="ts">
	import { clearUserDraft } from '$lib/drafts/persistence';
	import { Switch } from 'bits-ui';
	import { AppShell, Button, Card, ModalDialog, Avatar } from '$lib/components/ui';
	import { onMount } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faArrowLeft,
		faUser,
		faCog,
		faLock,
		faFileAlt,
		faExclamationTriangle
	} from '@fortawesome/free-solid-svg-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let logoutDialogOpen = $state(false);
	let reduceMotion = $state(false);
	let isLoggingOut = $state(false);
	let appearance = $state('System');

	onMount(() => {
		reduceMotion = localStorage.getItem('reduceMotion') === 'true';
	});

	$effect(() => {
		if (reduceMotion) {
			localStorage.setItem('reduceMotion', 'true');
			document.documentElement.classList.add('reduce-motion');
		} else {
			localStorage.setItem('reduceMotion', 'false');
			document.documentElement.classList.remove('reduce-motion');
		}
	});

	let joinedDate = $derived(
		new Date(data.user.createdAt).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
</script>

<AppShell user={data.user}>
	<main class="mx-auto max-w-3xl px-4 py-8 sm:py-12">
		<div class="mb-10 flex items-center gap-4">
			<Button variant="ghost" size="sm" href="/" aria-label="Go back">
				<FontAwesomeIcon icon={faArrowLeft} class="size-4" />
			</Button>
			<h1 class="text-3xl font-bold tracking-tight text-ink">Settings</h1>
		</div>

		<div class="space-y-12">
			<!-- 1. Account Section -->
			<section>
				<h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-ink">
					<FontAwesomeIcon icon={faUser} class="size-5 text-accent" />
					Account
				</h2>
				<div class="space-y-4">
					<!-- Profile Info -->
					<Card class="overflow-hidden shadow-sm">
						<div class="flex items-center justify-between bg-surface p-6 sm:p-8">
							<div class="flex items-center gap-5">
								<Avatar name={data.user.name} src={data.user.image} size="lg" />
								<div>
									<h3 class="text-xl font-bold text-ink sm:text-2xl">{data.user.name}</h3>
									<p class="text-muted">{data.user.email}</p>
								</div>
							</div>
							<Button variant="ghost" size="sm">Edit Profile</Button>
						</div>
					</Card>

					<!-- Change Password -->
					<Card class="overflow-hidden shadow-sm">
						<div class="space-y-4 p-6 sm:p-8">
							<h3 class="mb-4 text-lg font-bold text-ink">Change Password</h3>
							<div class="max-w-sm space-y-4">
								<div>
									<label class="mb-1 block text-sm font-medium text-ink" for="current-password"
										>Current Password</label
									>
									<input
										id="current-password"
										type="password"
										class="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm"
										placeholder="Enter current password"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-ink" for="new-password"
										>New Password</label
									>
									<input
										id="new-password"
										type="password"
										class="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm"
										placeholder="Enter new password"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-ink" for="confirm-password"
										>Confirm New Password</label
									>
									<input
										id="confirm-password"
										type="password"
										class="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm"
										placeholder="Confirm new password"
									/>
								</div>
								<Button variant="primary" class="mt-2 w-full sm:w-auto">Update Password</Button>
							</div>
						</div>
					</Card>

					<!-- Member Since -->
					<Card class="overflow-hidden shadow-sm">
						<div class="bg-surface p-6 sm:p-8">
							<div class="flex items-center justify-between">
								<span class="font-medium text-ink">Member since</span>
								<span class="font-mono text-muted">{joinedDate}</span>
							</div>
						</div>
					</Card>
				</div>
			</section>

			<!-- 2. Preferences Section -->
			<section>
				<h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-ink">
					<FontAwesomeIcon icon={faCog} class="size-5 text-accent" />
					Preferences
				</h2>
				<Card class="divide-y divide-line/60 shadow-sm">
					<!-- Language -->
					<div class="flex items-center justify-between gap-4 p-6 sm:p-8">
						<div>
							<p class="text-lg font-bold text-ink">Language</p>
							<p class="mt-1 text-sm text-muted">Select your interface language.</p>
						</div>
						<select
							class="rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
						>
							<option>English (US)</option>
							<option>日本語 (Japanese)</option>
						</select>
					</div>

					<!-- Reduce Motion -->
					<div
						class="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
					>
						<div class="max-w-md">
							<p class="text-lg font-bold text-ink">Reduce Motion</p>
							<p class="mt-1 text-sm leading-relaxed text-muted">
								Disables UI animations and transitions. Recommended if you prefer a simpler, faster
								feel or experience discomfort from motion.
							</p>
						</div>
						<Switch.Root
							bind:checked={reduceMotion}
							class="peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent data-[state=unchecked]:bg-line"
						>
							<Switch.Thumb
								class="pointer-events-none block h-6 w-6 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
							/>
						</Switch.Root>
					</div>

					<!-- Appearance -->
					<div
						class="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
					>
						<div>
							<p class="text-lg font-bold text-ink">Appearance</p>
							<p class="mt-1 text-sm text-muted">Choose your preferred theme.</p>
						</div>
						<div class="flex gap-2 rounded-lg border border-line bg-surface-muted p-1">
							{#each ['Light', 'Dark', 'System'] as theme (theme)}
								<button
									class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors {appearance ===
									theme
										? 'bg-white text-ink shadow-sm'
										: 'text-muted hover:text-ink'}"
									onclick={() => (appearance = theme)}
								>
									{theme}
								</button>
							{/each}
						</div>
					</div>
				</Card>
			</section>

			<!-- 3. Privacy & Security Section -->
			<section>
				<h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-ink">
					<FontAwesomeIcon icon={faLock} class="size-5 text-accent" />
					Privacy & Security
				</h2>
				<Card class="divide-y divide-line/60 shadow-sm">
					<!-- Login Sessions -->
					<div class="flex items-center justify-between gap-4 p-6 sm:p-8">
						<div>
							<p class="text-lg font-bold text-ink">Login Sessions</p>
							<p class="mt-1 text-sm text-muted">
								Manage devices currently logged into your account.
							</p>
						</div>
						<Button variant="ghost" size="sm">Manage Sessions</Button>
					</div>

					<!-- Profile Visibility -->
					<div class="flex items-center justify-between gap-4 p-6 sm:p-8">
						<div>
							<p class="text-lg font-bold text-ink">Profile Visibility</p>
							<p class="mt-1 text-sm text-muted">Control who can see your account details.</p>
						</div>
						<select
							class="rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
						>
							<option>Public</option>
							<option>Private</option>
						</select>
					</div>

					<!-- Sign Out -->
					<div class="flex items-center justify-between gap-4 p-6 sm:p-8">
						<div>
							<p class="text-lg font-bold text-ink">Sign Out</p>
							<p class="mt-1 text-sm text-muted">End your session on this device.</p>
						</div>
						<Button
							variant="danger"
							class="w-full sm:w-auto"
							onclick={() => (logoutDialogOpen = true)}
						>
							Log Out
						</Button>
					</div>
				</Card>
			</section>

			<!-- 4. Content Section -->
			<section>
				<h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-ink">
					<FontAwesomeIcon icon={faFileAlt} class="size-5 text-accent" />
					Content
				</h2>
				<Card class="shadow-sm">
					<div class="flex items-center justify-between gap-4 p-6 sm:p-8">
						<div>
							<p class="text-lg font-bold text-ink">Drafts</p>
							<p class="mt-1 text-sm text-muted">Manage your saved drafts and incomplete posts.</p>
						</div>
						<Button variant="ghost" size="sm">View Drafts</Button>
					</div>
				</Card>
			</section>

			<!-- 5. Danger Zone -->
			<section>
				<h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-danger">
					<FontAwesomeIcon icon={faExclamationTriangle} class="size-5 text-danger" />
					Danger Zone
				</h2>
				<Card class="overflow-hidden border-danger/30 shadow-sm">
					<div
						class="flex flex-col gap-4 bg-danger/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
					>
						<div class="max-w-md">
							<p class="text-lg font-bold text-danger">Delete Account</p>
							<p class="mt-1 text-sm leading-relaxed text-danger/80">
								Permanently remove your account and all of your content. This action cannot be
								undone.
							</p>
						</div>
						<Button variant="danger" class="w-full sm:w-auto">Delete Account</Button>
					</div>
				</Card>
			</section>
		</div>
	</main>
</AppShell>

<ModalDialog
	bind:open={logoutDialogOpen}
	title="Log out"
	description="Are you sure you want to log out?"
>
	<p class="text-ink">You can sign back in with Google or your email and password.</p>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (logoutDialogOpen = false)} disabled={isLoggingOut}>
			Cancel
		</Button>
		<form
			method="POST"
			action="/logout"
			class="contents"
			onsubmit={() => {
				isLoggingOut = true;
				if (data.user?.id) {
					clearUserDraft(data.user.id);
				}
			}}
		>
			<Button variant="danger" type="submit" loading={isLoggingOut}>Log out</Button>
		</form>
	{/snippet}
</ModalDialog>
