<script lang="ts">
	interface IInputProps {
		class?: string;
		type?: string;
		value?: string;
		[key: string]: unknown;
	}

	let { class: className = '', type = 'text', value = '', ...rest }: IInputProps = $props();
</script>

<input class={['ui-input', className]} {type} {value} {...rest} />

<style>
	.ui-input {
		min-height: 44px;
		width: 100%;
		border: 1px solid var(--qc-border-strong);
		border-radius: var(--qc-radius-md);
		background: #ffffff;
		padding: 0 12px;
		color: var(--qc-text);
		font: inherit;
	}

	.ui-input:focus {
		border-color: var(--qc-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--qc-primary) 14%, transparent);
		outline: 0;
	}
</style>
