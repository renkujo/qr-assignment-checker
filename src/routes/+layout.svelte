<script lang="ts">
	import '$lib/styles/app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/app-icon.svg" />
</svelte:head>

{@render children()}
