<script lang="ts">
	interface ICardProps {
		children: import('svelte').Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let { children, class: className = '', ...rest }: ICardProps = $props();
</script>

<section class={['ui-card', className]} {...rest}>
	{@render children()}
</section>

<style>
	.ui-card {
		border: 1px solid var(--qc-border);
		border-radius: var(--qc-radius-lg);
		background: var(--qc-surface);
		box-shadow: var(--qc-shadow);
	}
</style>
