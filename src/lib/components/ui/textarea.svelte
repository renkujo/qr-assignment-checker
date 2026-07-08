<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	interface ITextareaProps extends HTMLTextareaAttributes {
		class?: string;
	}

	let { class: className = '', ...restProps }: ITextareaProps = $props();
</script>

<textarea class={['ui-textarea', className].filter(Boolean).join(' ')} {...restProps}></textarea>

<style>
	.ui-textarea {
		width: 100%;
		min-height: 160px;
		resize: vertical;
		border: 1px solid var(--qc-border-strong);
		border-radius: var(--qc-radius-md);
		background: var(--qc-surface);
		padding: 12px 14px;
		color: var(--qc-text);
		font: inherit;
		line-height: 1.5;
		outline: none;
		box-shadow: none;
	}

	.ui-textarea::placeholder {
		color: var(--qc-muted);
	}

	.ui-textarea:focus {
		border-color: var(--qc-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--qc-primary) 14%, transparent);
	}
</style>
