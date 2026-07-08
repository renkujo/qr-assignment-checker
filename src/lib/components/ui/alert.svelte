<script lang="ts">
	interface IAlertProps {
		children: import('svelte').Snippet;
		variant?: 'info' | 'success' | 'warning' | 'danger';
		class?: string;
	}

	let { children, variant = 'info', class: className = '' }: IAlertProps = $props();
</script>

<div class={[`ui-alert ui-alert--${variant}`, className]} role="status">
	{@render children()}
</div>

<style>
	.ui-alert {
		border: 1px solid var(--qc-border);
		border-radius: var(--qc-radius-sm);
		padding: 12px 14px;
		font-weight: 500;
		line-height: 1.5;
	}

	.ui-alert--info {
		border-color: color-mix(in srgb, var(--qc-info) 24%, white);
		background: var(--qc-info-soft);
		color: var(--qc-info);
	}

	.ui-alert--success {
		border-color: color-mix(in srgb, var(--qc-success) 24%, white);
		background: var(--qc-success-soft);
		color: var(--qc-success);
	}

	.ui-alert--warning {
		border-color: color-mix(in srgb, var(--qc-warning) 24%, white);
		background: var(--qc-warning-soft);
		color: var(--qc-warning);
	}

	.ui-alert--danger {
		border-color: color-mix(in srgb, var(--qc-danger) 24%, white);
		background: var(--qc-danger-soft);
		color: var(--qc-danger);
	}
</style>
