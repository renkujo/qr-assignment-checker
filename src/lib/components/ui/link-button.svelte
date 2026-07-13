<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface ILinkButtonProps extends HTMLAnchorAttributes {
		children: import('svelte').Snippet;
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'md' | 'lg';
		class?: string;
	}

	let {
		children,
		variant = 'secondary',
		size = 'md',
		class: className = '',
		...restProps
	}: ILinkButtonProps = $props();
</script>

<a
	class={[`ui-link-button ui-link-button--${variant} ui-link-button--${size}`, className]}
	{...restProps}
>
	{@render children()}
</a>

<style>
	.ui-link-button {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid transparent;
		border-radius: var(--qc-radius-md);
		padding: 0 16px;
		font-weight: 500;
		line-height: 1;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
	}

	.ui-link-button--md {
		min-height: 44px;
	}

	.ui-link-button--lg {
		min-height: 44px;
		padding-inline: 20px;
	}

	.ui-link-button--primary {
		border-color: var(--qc-primary);
		background: var(--qc-primary);
		color: #ffffff;
	}

	.ui-link-button--primary:hover {
		background: var(--qc-primary-strong);
	}

	.ui-link-button--secondary {
		border-color: var(--qc-border-strong);
		background: var(--qc-surface);
		color: var(--qc-text);
	}

	.ui-link-button--secondary:hover {
		border-color: var(--qc-primary);
		background: var(--qc-primary-soft);
		color: var(--qc-primary-strong);
	}

	.ui-link-button--ghost {
		min-height: 44px;
		border-color: transparent;
		background: transparent;
		padding: 0;
		color: var(--qc-primary);
	}

	.ui-link-button--ghost:hover {
		color: var(--qc-primary-strong);
	}
</style>
