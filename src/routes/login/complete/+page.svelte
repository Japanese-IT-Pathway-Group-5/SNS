<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	async function finishTransition(event: AnimationEvent) {
		if (event.target !== event.currentTarget || event.animationName !== 'screen-reveal') return;
		await goto(resolve(data.redirectTo as `/${string}`), { replaceState: true, noScroll: true });
	}
</script>

<svelte:head>
	<title>Welcome to Claymore</title>
	<meta name="description" content="Opening your Claymore journal." />
</svelte:head>

<main
	class="transition-screen fixed inset-0 z-50 overflow-hidden bg-canvas"
	onanimationend={finishTransition}
	aria-label="Opening your journal"
>
	<section
		class="curtain-green absolute inset-y-0 left-0 flex w-1/2 flex-col bg-accent px-7 py-7 text-white sm:px-10 sm:py-9 lg:px-14 lg:py-12 xl:px-20"
	>
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-[0.14]"
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
		<div class="relative z-10 flex items-center gap-3">
			<img src="/logo.svg" alt="" class="size-16 brightness-0 invert" />
			<span class="text-lg font-semibold tracking-tight">Claymore</span>
		</div>
		<div class="relative z-10 flex flex-1 flex-col justify-center py-8">
			<h1
				class="max-w-xl text-4xl leading-[1.08] font-semibold tracking-[-0.04em] sm:text-5xl xl:text-6xl"
			>
				Your day doesn't have to be special to be worth sharing.
			</h1>
			<p
				class="homey-subtitle mt-6 max-w-lg text-lg leading-8 text-white/85 sm:mt-7 sm:text-xl sm:leading-9"
			>
				Keep the little moments, thoughts, and photos that make up an ordinary day.
			</p>
		</div>
	</section>

	<section
		class="curtain-light absolute inset-y-0 right-0 flex w-1/2 items-center justify-center bg-canvas px-6 sm:px-12 lg:px-12 xl:px-20"
	>
		<div class="welcome-copy w-full max-w-md text-center">
			<img src="/logo.svg" alt="" class="mx-auto size-12" />
			<p class="mt-5 text-sm font-semibold text-accent">Claymore</p>
			<h2 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
				Your journal is ready.
			</h2>
		</div>
	</section>
</main>

<style>
	.homey-subtitle {
		font-family: 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive;
	}

	.transition-screen {
		animation: screen-reveal 480ms ease-in 1150ms both;
	}

	.curtain-green {
		animation: curtain-close 1250ms cubic-bezier(0.72, 0, 0.3, 1) both;
	}

	.curtain-light {
		animation: light-fade 800ms ease-in 350ms both;
	}

	.welcome-copy {
		animation: welcome-fade 300ms ease-out 650ms both;
	}

	@keyframes curtain-close {
		from {
			width: 50%;
		}
		to {
			width: 100%;
		}
	}

	@keyframes light-fade {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@keyframes welcome-fade {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes screen-reveal {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@media (max-width: 639px) {
		.curtain-green {
			width: 100%;
			animation: none;
		}

		.curtain-light {
			display: none;
		}

		.transition-screen {
			animation-delay: 650ms;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.transition-screen,
		.curtain-green,
		.curtain-light,
		.welcome-copy {
			animation-duration: 1ms;
			animation-delay: 0ms;
		}
	}
</style>
