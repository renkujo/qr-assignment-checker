<script lang="ts">
	interface IButtonProps {
		children: import('svelte').Snippet;
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'md' | 'lg';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		children,
		type = 'button',
		variant = 'primary',
		size = 'md',
		disabled = false,
		class: className = '',
		onclick
	}: IButtonProps = $props();
</script>

<button
	class={[`ui-button ui-button--${variant} ui-button--${size}`, className]}
	{type}
	{disabled}
	{onclick}
>
	{@render children()}
</button>

<style>
	.ui-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid transparent;
		border-radius: var(--qc-radius-md);
		padding: 0 16px;
		font: inherit;
		font-weight: 500;
		line-height: 1;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
	}

	.ui-button--md {
		min-height: 44px;
	}

	.ui-button--lg {
		min-height: 44px;
		padding-inline: 20px;
	}

	.ui-button--primary {
		border-color: var(--qc-primary);
		background: var(--qc-primary);
		color: #ffffff;
	}

	.ui-button--primary:hover:not(:disabled) {
		background: var(--qc-primary-strong);
	}

	.ui-button--secondary {
		border-color: var(--qc-border-strong);
		background: var(--qc-surface);
		color: var(--qc-text);
	}

	.ui-button--secondary:hover:not(:disabled) {
		border-color: var(--qc-primary);
		background: var(--qc-primary-soft);
	}

	.ui-button--danger {
		border-color: color-mix(in srgb, var(--qc-danger) 28%, white);
		background: var(--qc-danger-soft);
		color: var(--qc-danger);
	}

	.ui-button--ghost {
		border-color: transparent;
		background: transparent;
		color: var(--qc-primary);
	}

	.ui-button:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}
</style>
