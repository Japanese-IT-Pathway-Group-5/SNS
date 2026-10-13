<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { signIn, signInWithGoogle, signUp } from '$lib/auth-client';
	import { FormMessage } from '$lib/components/ui';
	import { sanitizeRedirectUrl } from '$lib/utils';
	import { getUiPreferences, t } from '$lib/preferences/ui';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSpinner } from '@fortawesome/free-solid-svg-icons';

	const ui = getUiPreferences();
	let isSigningIn = $state(false);
	let isSubmittingEmail = $state(false);
	let errorMessage = $state<string | null>(null);
	let authMode = $state<'sign-in' | 'sign-up'>('sign-in');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let confirmPasswordInput = $state<HTMLInputElement>();
	let passwordsMismatch = $state(false);

	const redirectTo = $derived(sanitizeRedirectUrl(page.url.searchParams.get('redirectTo'), '/'));
	const isSigningUp = $derived(authMode === 'sign-up');

	function getCompletionUrl() {
		const callbackUrl = new URL('/login/complete', window.location.origin);
		callbackUrl.searchParams.set('redirectTo', redirectTo);
		return callbackUrl.toString();
	}

	async function handleEmailAuth(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = null;
		passwordsMismatch = isSigningUp && password !== confirmPassword;
		if (passwordsMismatch) {
			confirmPasswordInput?.focus();
			return;
		}
		isSubmittingEmail = true;

		try {
			const callbackURL = getCompletionUrl();
			const result = isSigningUp
				? await signUp.email({ name: name.trim(), email: email.trim(), password, callbackURL })
				: await signIn.email({ email: email.trim(), password, callbackURL });

			if (result.error) {
				console.error('Email authentication failed:', result.error);
				errorMessage = isSigningUp
					? t(ui, 'auth.emailSignUpError')
					: t(ui, 'auth.emailSignInError');
				isSubmittingEmail = false;
				return;
			}

			window.location.assign(callbackURL);
		} catch (err) {
			console.error('Email authentication exception:', err);
			errorMessage = t(ui, 'auth.connectionError');
			isSubmittingEmail = false;
		}
	}

	async function handleGoogleSignIn() {
		isSigningIn = true;
		errorMessage = null;

		try {
			const { error } = await signInWithGoogle(getCompletionUrl());
			if (error) {
				console.error('Sign in failed:', error);
				errorMessage = t(ui, 'auth.googleStartError');
				isSigningIn = false;
			}
		} catch (err) {
			console.error('Sign in exception:', err);
			errorMessage = t(ui, 'auth.genericError');
			isSigningIn = false;
		}
	}
</script>

<svelte:head>
	<title>{t(ui, 'auth.title')} — Claymore</title>
	<meta name="description" content={t(ui, 'auth.description')} />
</svelte:head>

{#snippet passwordEye(visible: boolean)}
	<svg
		class="size-5"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.75"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{#if visible}
			<path
				d="M2 2 22 22M10.58 10.59a2 2 0 0 0 2.83 2.82M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.77 13.77 0 0 1-3.2 4.4M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a10.83 10.83 0 0 0 5.39-1.39"
			/>
		{:else}
			<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
			<circle cx="12" cy="12" r="3" />
		{/if}
	</svg>
{/snippet}

<main class="h-svh overflow-hidden bg-canvas p-0">
	<div class="grid h-full grid-rows-1 overflow-hidden bg-canvas lg:grid-cols-2">
		<section
			class="relative hidden min-h-0 flex-col justify-between overflow-hidden bg-accent px-7 py-7 text-on-accent sm:px-10 sm:py-9 lg:flex lg:px-14 lg:py-12 xl:px-20"
		>
			<div
				aria-hidden="true"
				class="art-pattern pointer-events-none absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-[0.14]"
			>
				<img src="/art/swinging.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/sleek.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/sitting-reading.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/reading.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/meditating.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/dancing.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/selfie.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/clumsy.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/jumping.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/dog-jump.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/ballet.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/swinging.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/reading.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/jumping.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/dog-jump.svg" alt="" class="h-full w-full object-contain" />
				<img src="/art/ballet.svg" alt="" class="h-full w-full object-contain" />
			</div>
			<a
				href={resolve('/')}
				aria-label={t(ui, 'auth.home')}
				class="relative z-10 flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-accent"
			>
				<img src="/logo.svg" alt="" class="size-16 brightness-0 invert" />
				<span class="text-lg font-semibold tracking-tight">Claymore</span>
			</a>

			<div class="relative z-10 flex flex-1 flex-col justify-center py-8 sm:py-10 lg:py-12">
				<h1
					class="max-w-xl text-4xl leading-[1.08] font-semibold tracking-[-0.04em] sm:text-5xl xl:text-6xl"
				>
					{t(ui, 'auth.promise')}
				</h1>
				<p
					class="homey-subtitle mt-6 max-w-lg text-lg leading-8 text-white/85 sm:mt-7 sm:text-xl sm:leading-9"
				>
					{t(ui, 'auth.promiseDescription')}
				</p>
			</div>
		</section>

		<section
			class="auth-panel flex min-h-0 flex-col bg-canvas px-6 py-5 sm:px-12 sm:py-8 lg:items-center lg:justify-center lg:px-8 xl:px-12"
		>
			<header
				class="mobile-brand relative -mx-6 -mt-5 mb-6 w-[calc(100%+3rem)] shrink-0 overflow-hidden bg-accent px-6 py-4 text-on-accent sm:-mx-12 sm:-mt-8 sm:min-h-48 sm:w-[calc(100%+6rem)] sm:px-12 sm:py-10 lg:hidden"
			>
				<div
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 grid grid-cols-4 opacity-[0.14]"
				>
					<img src="/art/swinging.svg" alt="" class="h-full w-full object-contain" />
					<img src="/art/sitting-reading.svg" alt="" class="h-full w-full object-contain" />
					<img src="/art/dancing.svg" alt="" class="h-full w-full object-contain" />
					<img src="/art/dog-jump.svg" alt="" class="h-full w-full object-contain" />
				</div>
				<div class="relative z-10 mx-auto flex w-full max-w-md items-center justify-between gap-4">
					<a
						href={resolve('/')}
						aria-label={t(ui, 'auth.home')}
						class="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-accent"
					>
						<img src="/logo.svg" alt="" class="size-14 shrink-0 brightness-0 invert" />
						<span class="text-xl font-semibold tracking-tight">Claymore</span>
					</a>
					<a
						href={resolve('/')}
						class="inline-flex min-h-11 items-center rounded-sm text-sm text-on-accent underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-accent"
						>{t(ui, 'auth.browse')}</a
					>
				</div>
			</header>
			<div class="auth-content mx-auto my-auto w-full max-w-lg lg:my-0">
				<div class="mb-5 sm:mb-6">
					<h2 class="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
						{isSigningUp ? t(ui, 'auth.headlineSignUp') : t(ui, 'auth.headlineSignIn')}
					</h2>
					<p class="mt-2 text-sm leading-6 text-muted sm:mt-3 sm:text-base sm:leading-7">
						{isSigningUp ? t(ui, 'auth.introSignUp') : t(ui, 'auth.introSignIn')}
					</p>
				</div>

				{#if errorMessage}
					<div class="mb-5"><FormMessage type="error" message={errorMessage} /></div>
				{/if}

				<form class="space-y-4" onsubmit={handleEmailAuth}>
					{#if isSigningUp}
						<div class="space-y-1.5">
							<label for="auth-name" class="text-sm font-semibold text-ink"
								>{t(ui, 'auth.name')}</label
							>
							<input
								id="auth-name"
								placeholder={t(ui, 'auth.namePlaceholder')}
								bind:value={name}
								autocomplete="name"
								maxlength="80"
								required
								class="min-h-11 w-full rounded-lg border border-control-border bg-surface px-3.5 py-2.5 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:border-accent focus:bg-accent-soft focus:outline-2 focus:outline-offset-2 focus:outline-accent motion-reduce:transition-none"
							/>
						</div>
					{/if}
					<div class="space-y-1.5">
						<label for="auth-email" class="text-sm font-semibold text-ink"
							>{t(ui, 'auth.email')}</label
						>
						<input
							id="auth-email"
							placeholder="you@example.com"
							bind:value={email}
							type="email"
							autocomplete="email"
							inputmode="email"
							required
							class="min-h-11 w-full rounded-lg border border-control-border bg-surface px-3.5 py-2.5 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:border-accent focus:bg-accent-soft focus:outline-2 focus:outline-offset-2 focus:outline-accent motion-reduce:transition-none"
						/>
					</div>
					<div class={isSigningUp ? 'grid gap-4 sm:grid-cols-2' : ''}>
						<div class="space-y-1.5">
							<label for="auth-password" class="text-sm font-semibold text-ink"
								>{t(ui, 'auth.password')}</label
							>
							<div class="relative">
								<input
									id="auth-password"
									placeholder={isSigningUp
										? t(ui, 'auth.passwordNew')
										: t(ui, 'auth.passwordExisting')}
									bind:value={password}
									type={showPassword ? 'text' : 'password'}
									oninput={() => {
										passwordsMismatch = false;
									}}
									autocomplete={isSigningUp ? 'new-password' : 'current-password'}
									minlength="8"
									maxlength="128"
									required
									class="min-h-11 w-full rounded-lg border border-control-border bg-surface py-2.5 pr-16 pl-3.5 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:border-accent focus:bg-accent-soft focus:outline-2 focus:outline-offset-2 focus:outline-accent motion-reduce:transition-none"
								/>
								<button
									type="button"
									aria-label={showPassword
										? t(ui, 'auth.hidePassword')
										: t(ui, 'auth.showPassword')}
									aria-controls="auth-password"
									aria-pressed={showPassword}
									onclick={() => {
										showPassword = !showPassword;
									}}
									class="absolute inset-y-0 right-1 flex min-w-11 items-center justify-center rounded-md text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
								>
									{@render passwordEye(showPassword)}
								</button>
							</div>
						</div>
						{#if isSigningUp}
							<div class="space-y-1.5">
								<label for="auth-confirm-password" class="text-sm font-semibold text-ink"
									>{t(ui, 'auth.passwordConfirm')}</label
								>
								<div class="relative">
									<input
										id="auth-confirm-password"
										bind:this={confirmPasswordInput}
										bind:value={confirmPassword}
										type={showConfirmPassword ? 'text' : 'password'}
										autocomplete="new-password"
										placeholder={t(ui, 'auth.passwordReenter')}
										minlength="8"
										maxlength="128"
										required
										aria-invalid={passwordsMismatch}
										aria-describedby={passwordsMismatch ? 'password-match-error' : undefined}
										oninput={() => {
											passwordsMismatch = false;
										}}
										class="min-h-11 w-full rounded-lg border border-control-border bg-surface py-2.5 pr-16 pl-3.5 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:border-accent focus:bg-accent-soft focus:outline-2 focus:outline-offset-2 focus:outline-accent motion-reduce:transition-none"
									/>
									<button
										type="button"
										aria-label={showConfirmPassword
											? t(ui, 'auth.hideConfirmPassword')
											: t(ui, 'auth.showConfirmPassword')}
										aria-controls="auth-confirm-password"
										aria-pressed={showConfirmPassword}
										onclick={() => {
											showConfirmPassword = !showConfirmPassword;
										}}
										class="absolute inset-y-0 right-1 flex min-w-11 items-center justify-center rounded-md text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
									>
										{@render passwordEye(showConfirmPassword)}
									</button>
								</div>
								{#if passwordsMismatch}<p
										id="password-match-error"
										role="alert"
										class="text-sm text-danger"
									>
										{t(ui, 'auth.passwordMismatch')}
									</p>{/if}
							</div>
						{/if}
					</div>
					<button
						type="submit"
						disabled={isSubmittingEmail}
						aria-busy={isSubmittingEmail}
						class="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-base font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-65"
					>
						{#if isSubmittingEmail}
							<FontAwesomeIcon icon={faSpinner} class="size-4 animate-spin" />
							<span
								>{isSigningUp
									? t(ui, 'auth.submittingSignUp')
									: t(ui, 'auth.submittingSignIn')}</span
							>
						{:else}
							{isSigningUp ? t(ui, 'auth.submitSignUp') : t(ui, 'auth.submitSignIn')}
						{/if}
					</button>
				</form>

				<p class="mt-3 text-center text-sm text-muted">
					{isSigningUp ? t(ui, 'auth.existingAccount') : t(ui, 'auth.newAccount')}
					<button
						type="button"
						class="font-semibold text-accent underline underline-offset-2"
						onclick={() => {
							authMode = isSigningUp ? 'sign-in' : 'sign-up';
							errorMessage = null;
							confirmPassword = '';
							passwordsMismatch = false;
							showPassword = false;
							showConfirmPassword = false;
						}}
					>
						{isSigningUp ? t(ui, 'auth.switchSignIn') : t(ui, 'auth.switchSignUp')}
					</button>
				</p>

				<div class="my-5 flex items-center gap-4" aria-hidden="true">
					<div class="h-px flex-1 bg-line"></div>
					<span class="text-sm text-muted">{t(ui, 'auth.or')}</span>
					<div class="h-px flex-1 bg-line"></div>
				</div>

				<button
					type="button"
					onclick={handleGoogleSignIn}
					disabled={isSigningIn}
					aria-busy={isSigningIn}
					class="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-control-border bg-surface px-4 py-3 text-base font-semibold text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent enabled:hover:outline-2 enabled:hover:outline-offset-2 enabled:hover:outline-accent disabled:cursor-wait disabled:opacity-65"
				>
					{#if isSigningIn}
						<FontAwesomeIcon icon={faSpinner} class="size-4 animate-spin text-accent" />
						<span>{t(ui, 'auth.googleConnecting')}</span>
					{:else}
						<svg class="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
							/>
						</svg>
						<span>{t(ui, 'auth.googleContinue')}</span>
					{/if}
				</button>

				<p class="mt-5 text-center text-xs leading-5 text-muted sm:mt-5">
					{t(ui, 'auth.respect')}
				</p>
				<div class="mt-3 hidden text-center lg:block">
					<a
						href={resolve('/')}
						class="inline-flex min-h-11 items-center rounded-sm text-sm text-muted underline underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
						>{t(ui, 'auth.browseFeed')}</a
					>
				</div>
			</div>
		</section>
	</div>
</main>

<style>
	input::-ms-reveal {
		display: none;
	}

	.homey-subtitle {
		font-family: 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive;
	}

	.art-pattern img:nth-child(4n + 2) {
		transform: translateY(12%);
	}

	.art-pattern img:nth-child(4n + 3) {
		transform: translateY(-10%);
	}

	@media (max-height: 560px) {
		main > div {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr;
		}

		main > div > section:first-child {
			display: none;
		}

		main > div > section:last-child {
			padding-block: 0.75rem;
		}

		main > div > section:last-child > div > div:first-child {
			margin-bottom: 0.75rem;
		}

		.mobile-brand {
			margin-top: -0.75rem;
			margin-bottom: 0.75rem;
			min-height: 0;
			padding-block: 0.5rem;
		}

		.mobile-brand a img {
			width: 2.5rem;
			height: 2.5rem;
		}

		main > div > section:last-child > div > p:last-of-type,
		main > div > section:last-child > div > div:last-child {
			display: none;
		}
	}
</style>
