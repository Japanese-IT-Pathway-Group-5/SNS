<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import ModalDialog from '$lib/components/ui/ModalDialog.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import FormMessage from '$lib/components/ui/FormMessage.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEyeSlash } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		postId: string;
		hideError?: string | null;
	}

	let { postId, hideError = null }: Props = $props();

	let hideOpen = $state(false);
	let hideReason = $state('');
</script>

<Button
	variant="ghost"
	size="sm"
	onclick={() => {
		hideOpen = true;
	}}
	class="group text-muted hover:bg-surface-muted hover:text-danger"
>
	<FontAwesomeIcon icon={faEyeSlash} class="size-4 transition-transform group-active:scale-95" />
	<span class="font-medium">Hide</span>
</Button>

{#if hideError}
	<FormMessage type="error" message={hideError} />
{/if}

<ModalDialog
	bind:open={hideOpen}
	title="Hide post"
	description="This post will be hidden from all readers."
>
	<form
		method="POST"
		action="?/hidePost"
		use:enhance={() => {
			return async ({ update, result }) => {
				if (result.type === 'redirect') {
					hideOpen = false;
					hideReason = '';
				}
				await update();
			};
		}}
	>
		<input type="hidden" name="postId" value={postId} />
		<Textarea
			label="Reason"
			name="reason"
			required
			placeholder="Why should this post be hidden?"
			maxCount={500}
			showCount
			rows={3}
			bind:value={hideReason}
		/>
		<div class="mt-4 flex items-center justify-end gap-2">
			<Button
				variant="secondary"
				size="sm"
				onclick={() => {
					hideOpen = false;
				}}>Cancel</Button
			>
			<Button variant="danger" size="sm" type="submit">Hide post</Button>
		</div>
	</form>
</ModalDialog>
