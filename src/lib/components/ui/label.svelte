<script lang="ts">
	interface ILabelProps {
		children: import('svelte').Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let { children, class: className = '', ...rest }: ILabelProps = $props();
</script>

<label class={['ui-label', className]} {...rest}>
	{@render children()}
</label>

<style>
	.ui-label {
		display: grid;
		gap: 7px;
		color: var(--qc-text);
		font-weight: 600;
	}
</style>
