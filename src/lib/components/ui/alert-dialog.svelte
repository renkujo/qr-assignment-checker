<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import Button from './button.svelte';

	interface IAlertDialogProps {
		open?: boolean;
		title: string;
		description?: string;
		children?: Snippet;
		cancelLabel?: string;
		confirmLabel?: string;
		pendingLabel?: string;
		confirmVariant?: 'primary' | 'danger';
		pending?: boolean;
		closeOnConfirm?: boolean;
		class?: string;
		oncancel?: () => void;
		onconfirm?: () => void;
	}

	let {
		open = $bindable(false),
		title,
		description,
		children,
		cancelLabel = 'Cancel',
		confirmLabel = 'Confirm',
		pendingLabel = 'Saving…',
		confirmVariant = 'primary',
		pending = false,
		closeOnConfirm = true,
		class: className = '',
		oncancel,
		onconfirm
	}: IAlertDialogProps = $props();

	const componentId = $props.id();
	const titleId = `${componentId}-title`;
	const descriptionId = `${componentId}-description`;

	let dialogElement = $state<HTMLDivElement>();
	let previouslyFocused: HTMLElement | null = null;

	function cancel() {
		if (pending) return;

		open = false;
		oncancel?.();
	}

	function confirm() {
		if (pending) return;

		onconfirm?.();
		if (closeOnConfirm) open = false;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (!open || pending || event.key !== 'Escape') return;

		event.preventDefault();
		cancel();
	}

	function handleDialogKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !dialogElement) return;

		const focusableElements = Array.from(
			dialogElement.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => !element.hasAttribute('hidden'));

		if (focusableElements.length === 0) {
			event.preventDefault();
			dialogElement.focus();
			return;
		}

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		const activeElement = document.activeElement;

		if (activeElement === dialogElement) {
			event.preventDefault();
			(event.shiftKey ? lastElement : firstElement).focus();
			return;
		}

		if (event.shiftKey && activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
		} else if (!event.shiftKey && activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
		}
	}

	$effect(() => {
		if (!open || typeof document === 'undefined') return;

		previouslyFocused =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const previousOverflow = document.body.style.overflow;
		let cancelled = false;

		document.body.style.overflow = 'hidden';
		void tick().then(() => {
			if (!cancelled) {
				dialogElement?.querySelector<HTMLButtonElement>('.ui-alert-dialog__cancel')?.focus();
			}
		});

		return () => {
			cancelled = true;
			document.body.style.overflow = previousOverflow;
			if (previouslyFocused?.isConnected) previouslyFocused.focus();
		};
	});
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if open}
	<div class="ui-alert-dialog__layer">
		<button
			type="button"
			class="ui-alert-dialog__backdrop"
			disabled={pending}
			tabindex="-1"
			aria-label={cancelLabel}
			onclick={cancel}
		></button>

		<div
			bind:this={dialogElement}
			class={['ui-alert-dialog', className]}
			role="alertdialog"
			aria-modal="true"
			aria-busy={pending}
			aria-labelledby={titleId}
			aria-describedby={description || children ? descriptionId : undefined}
			tabindex="-1"
			onkeydown={handleDialogKeydown}
		>
			<div class="ui-alert-dialog__header">
				<h2 id={titleId} class="ui-alert-dialog__title">{title}</h2>
				{#if description || children}
					<div id={descriptionId} class="ui-alert-dialog__description">
						{#if description}<p>{description}</p>{/if}
						{#if children}{@render children()}{/if}
					</div>
				{/if}
			</div>

			<div class="ui-alert-dialog__actions">
				<Button
					type="button"
					variant="secondary"
					class="ui-alert-dialog__action ui-alert-dialog__cancel"
					disabled={pending}
					onclick={cancel}
				>
					{cancelLabel}
				</Button>
				<Button
					type="button"
					variant={confirmVariant}
					class="ui-alert-dialog__action ui-alert-dialog__confirm"
					disabled={pending}
					onclick={confirm}
				>
					{pending ? pendingLabel : confirmLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.ui-alert-dialog__layer {
		position: fixed;
		z-index: 1000;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 20px;
	}

	.ui-alert-dialog__backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		background: color-mix(in srgb, var(--qc-text) 42%, transparent);
		cursor: default;
	}

	.ui-alert-dialog {
		position: relative;
		width: min(100%, 460px);
		border: 1px solid var(--qc-border-strong);
		border-radius: var(--qc-radius-lg);
		background: var(--qc-surface-raised);
		color: var(--qc-text);
		box-shadow: var(--qc-shadow);
		max-height: calc(100dvh - 40px);
		overflow-y: auto;
		animation: ui-alert-dialog-in 160ms ease-out;
	}

	.ui-alert-dialog__header {
		padding: 24px 24px 20px;
	}

	.ui-alert-dialog__title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.35;
	}

	.ui-alert-dialog__description {
		margin-top: 8px;
		color: var(--qc-muted);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.ui-alert-dialog__description :global(p) {
		margin: 0;
	}

	.ui-alert-dialog__actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		border-top: 1px solid var(--qc-border);
		padding: 16px 24px;
	}

	:global(.ui-alert-dialog__action.ui-button) {
		min-width: 108px;
	}

	@keyframes ui-alert-dialog-in {
		from {
			opacity: 0;
			transform: translateY(4px) scale(0.99);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (max-width: 520px) {
		.ui-alert-dialog__layer {
			align-items: end;
			padding: 12px;
		}

		.ui-alert-dialog__actions {
			flex-direction: column-reverse;
		}

		:global(.ui-alert-dialog__action.ui-button) {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ui-alert-dialog {
			animation: none;
		}
	}
</style>
