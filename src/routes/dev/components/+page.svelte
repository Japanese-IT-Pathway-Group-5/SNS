<script lang="ts">
	import {
		Button,
		Card,
		Input,
		Textarea,
		Avatar,
		Badge,
		FormMessage,
		EmptyState,
		LoadingState,
		ModalDialog
	} from '$lib/components/ui';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faHouse, faHeart, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

	let sampleInput = $state('');
	let sampleInputError = $state('This field is required');
	let sampleTextarea = $state('Today was peaceful. Walked by the river and noticed a tiny sprout.');
	let dialogOpen = $state(false);
	let loadingButton = $state(false);

	function toggleLoading() {
		loadingButton = true;
		setTimeout(() => {
			loadingButton = false;
		}, 1500);
	}
</script>

<svelte:head>
	<title>Component Showcase — SNS Dev</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-12 px-4 py-10 pb-24">
	<header class="space-y-2 border-b border-line pb-6">
		<div class="flex items-center gap-2">
			<span
				class="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs font-bold text-accent uppercase"
				>Dev Only</span
			>
			<h1 class="text-2xl font-bold tracking-tight text-ink">Design System & Component Showcase</h1>
		</div>
		<p class="text-sm text-muted">
			Interactive reference for teammates and AI coding assistants. Import all primitives from
			<code class="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-accent"
				>$lib/components/ui</code
			>.
		</p>
	</header>

	<!-- Color Tokens -->
	<section class="space-y-4">
		<h2 class="text-lg font-bold text-ink">Semantic Color Tokens</h2>
		<div class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
			<div class="flex h-20 flex-col justify-between rounded-lg border border-line bg-canvas p-3">
				<span class="font-bold text-ink">canvas</span>
				<span class="font-mono text-muted">#E8F8EF</span>
			</div>
			<div
				class="flex h-20 flex-col justify-between rounded-lg border border-line bg-surface p-3 shadow-xs"
			>
				<span class="font-bold text-ink">surface</span>
				<span class="font-mono text-muted">#FFFCF5</span>
			</div>
			<div
				class="flex h-20 flex-col justify-between rounded-lg border border-line bg-surface-muted p-3"
			>
				<span class="font-bold text-ink">surface-muted</span>
				<span class="font-mono text-muted">#DCEEE5</span>
			</div>
			<div class="flex h-20 flex-col justify-between rounded-lg bg-accent p-3 text-on-accent">
				<span class="font-bold">accent</span>
				<span class="font-mono opacity-80">#326B66</span>
			</div>
			<div
				class="flex h-20 flex-col justify-between rounded-lg border border-line bg-accent-soft p-3 text-accent"
			>
				<span class="font-bold">accent-soft</span>
				<span class="font-mono opacity-80">#D3EAE3</span>
			</div>
			<div
				class="flex h-20 flex-col justify-between rounded-lg border border-line bg-peach/40 p-3 text-ink"
			>
				<span class="font-bold">peach</span>
				<span class="font-mono text-muted">#FFB78E</span>
			</div>
			<div
				class="flex h-20 flex-col justify-between rounded-lg border border-line bg-lime/50 p-3 text-ink"
			>
				<span class="font-bold">lime</span>
				<span class="font-mono text-muted">#CEDF91</span>
			</div>
			<div class="flex h-20 flex-col justify-between rounded-lg bg-danger p-3 text-on-danger">
				<span class="font-bold">danger</span>
				<span class="font-mono opacity-80">#A52C36</span>
			</div>
		</div>
	</section>

	<!-- Buttons -->
	<section class="space-y-4">
		<h2 class="text-lg font-bold text-ink">
			Buttons (<code class="font-mono text-sm">&lt;Button /&gt;</code>)
		</h2>
		<div class="space-y-4 rounded-xl border border-line bg-surface p-5">
			<div class="flex flex-wrap items-center gap-3">
				<Button variant="primary">Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="danger">Danger</Button>
			</div>

			<div class="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
				<Button size="sm" variant="primary">Small</Button>
				<Button size="md" variant="primary">Medium (Default)</Button>
				<Button variant="secondary" disabled>Disabled</Button>
				<Button variant="primary" loading={loadingButton} onclick={toggleLoading}>
					{loadingButton ? 'Saving...' : 'Click for Loading State'}
				</Button>
			</div>

			<div class="flex items-center gap-3 border-t border-line/60 pt-3">
				<Button variant="secondary" size="sm">
					<FontAwesomeIcon icon={faHouse} class="size-4" />
					<span>With Icon</span>
				</Button>
				<Button variant="ghost" size="sm" aria-label="Like entry">
					<FontAwesomeIcon icon={faHeart} class="size-4 text-peach" />
					<span>Warm Nod</span>
				</Button>
			</div>
		</div>
	</section>

	<!-- Form Controls: Input & Textarea -->
	<section class="space-y-4">
		<h2 class="text-lg font-bold text-ink">
			Inputs & Textarea (<code class="font-mono text-sm">&lt;Input /&gt;</code>,
			<code class="font-mono text-sm">&lt;Textarea /&gt;</code>)
		</h2>
		<div class="space-y-5 rounded-xl border border-line bg-surface p-5">
			<Input
				label="Display Name"
				placeholder="e.g. Kenji"
				description="Visible to fellow pilot members."
				bind:value={sampleInput}
				required
			/>

			<Input
				label="Input with validation error"
				placeholder="Enter something"
				error={sampleInputError}
			/>

			<Textarea
				label="Today's entry"
				placeholder="Anything from today?"
				description="Your day doesn't have to be special to be worth sharing."
				bind:value={sampleTextarea}
				showCount
				maxCount={2000}
				rows={3}
			/>
		</div>
	</section>

	<!-- Avatars & Badges -->
	<section class="space-y-4">
		<h2 class="text-lg font-bold text-ink">
			Avatars & Badges (<code class="font-mono text-sm">&lt;Avatar /&gt;</code>,
			<code class="font-mono text-sm">&lt;Badge /&gt;</code>)
		</h2>
		<div class="space-y-4 rounded-xl border border-line bg-surface p-5">
			<div class="flex items-center gap-4">
				<Avatar name="Alice Tanaka" size="sm" />
				<Avatar name="Bob Smith" size="md" />
				<Avatar name="Kenji Sato" size="lg" />
			</div>

			<div class="flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
				<Badge variant="accent">Pilot Member</Badge>
				<Badge variant="peach">Warm reaction</Badge>
				<Badge variant="lime">🌱 Sprout</Badge>
				<Badge variant="muted">Archive</Badge>
				<Badge variant="danger">Moderated</Badge>
			</div>
		</div>
	</section>

	<!-- Form Messages -->
	<section class="space-y-4">
		<h2 class="text-lg font-bold text-ink">
			Alerts & Messages (<code class="font-mono text-sm">&lt;FormMessage /&gt;</code>)
		</h2>
		<div class="space-y-3">
			<FormMessage
				type="error"
				message="Could not save your entry. Your draft has been preserved on this device."
			/>
			<FormMessage type="success" message="Entry posted and shared with pilot members." />
		</div>
	</section>

	<!-- Dialogs -->
	<section class="space-y-4">
		<h2 class="text-lg font-bold text-ink">
			Accessible Modal Dialog (<code class="font-mono text-sm">&lt;ModalDialog /&gt;</code>)
		</h2>
		<div class="rounded-xl border border-line bg-surface p-5">
			<Button variant="secondary" onclick={() => (dialogOpen = true)}>
				Open Confirmation Dialog
			</Button>

			<ModalDialog
				bind:open={dialogOpen}
				title="Discard draft?"
				description="Are you sure you want to discard your draft? This action cannot be undone."
			>
				<p>Your local unsaved text will be permanently erased from this device.</p>
				{#snippet actions()}
					<Button variant="ghost" onclick={() => (dialogOpen = false)}>Keep writing</Button>
					<Button variant="danger" onclick={() => (dialogOpen = false)}>Discard</Button>
				{/snippet}
			</ModalDialog>
		</div>
	</section>

	<!-- States: Loading & Empty -->
	<section class="space-y-4">
		<h2 class="text-lg font-bold text-ink">
			States (<code class="font-mono text-sm">&lt;LoadingState /&gt;</code>,
			<code class="font-mono text-sm">&lt;EmptyState /&gt;</code>)
		</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Card variant="surface">
				<LoadingState status="Connecting to pilot members..." />
			</Card>

			<EmptyState
				title="No journal entries yet"
				description="Your day doesn't have to be special. Write down a small thought or what you had for lunch."
			>
				{#snippet action()}
					<Button variant="primary" size="sm">
						<FontAwesomeIcon icon={faWandMagicSparkles} class="size-4" />
						<span>Write first entry</span>
					</Button>
				{/snippet}
			</EmptyState>
		</div>
	</section>
</main>
