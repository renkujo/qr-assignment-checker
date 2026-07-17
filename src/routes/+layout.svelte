<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import '$lib/styles/app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/app-icon.svg" />
</svelte:head>

<Toaster
	position="top-center"
	richColors
	closeButton
	duration={2400}
	mobileOffset={16}
	containerAriaLabel="การแจ้งเตือน"
	closeButtonAriaLabel="ปิดการแจ้งเตือน"
/>

{@render children()}
