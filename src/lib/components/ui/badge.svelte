<script lang="ts">
	interface IBadgeProps {
		children: import('svelte').Snippet;
		variant?: 'success' | 'warning' | 'danger' | 'info' | 'muted';
		class?: string;
	}

	let { children, variant = 'muted', class: className = '' }: IBadgeProps = $props();
</script>

<span class={[`ui-badge ui-badge--${variant}`, className]}>
	{@render children()}
</span>

<style>
	.ui-badge {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		border-radius: 999px;
		padding: 4px 10px;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		line-height: 1;
		white-space: nowrap;
	}

	.ui-badge--success {
		background: var(--qc-success-soft);
		color: var(--qc-success);
	}

	.ui-badge--warning {
		background: var(--qc-warning-soft);
		color: var(--qc-warning);
	}

	.ui-badge--danger {
		background: var(--qc-danger-soft);
		color: var(--qc-danger);
	}

	.ui-badge--info {
		background: var(--qc-info-soft);
		color: var(--qc-info);
	}

	.ui-badge--muted {
		background: var(--qc-bg-soft);
		color: var(--qc-muted);
	}
</style>
