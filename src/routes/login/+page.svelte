<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert, Button, Card, Input, Label } from '$lib/components/ui';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>เข้าสู่ระบบ | QR Assignment Checker</title>
</svelte:head>

<main class="auth-shell">
	<Card class="auth-card" aria-labelledby="login-title">
		<a class="back-link" href={resolve('/')}>← กลับหน้าแรก</a>

		<div class="auth-heading">
			<p class="section-kicker">สำหรับครู</p>
			<h1 id="login-title">เข้าสู่ระบบครู</h1>
			<span>เข้าเพื่อจัดรายชื่อ สร้างงาน และสแกน QR ส่งงานของห้องเรียน</span>
		</div>

		{#if form?.message}
			<Alert variant="danger" class="form-error">{form.message}</Alert>
		{/if}

		<form method="POST" class="login-form">
			<input type="hidden" name="redirectTo" value={data.redirectTo} />

			<Label>
				<span>อีเมล</span>
				<Input name="email" type="email" autocomplete="email" value={form?.email || ''} required />
			</Label>

			<Label>
				<span>รหัสผ่าน</span>
				<Input name="password" type="password" autocomplete="current-password" required />
			</Label>

			<Button type="submit" size="lg" class="login-submit">เข้าสู่ระบบ</Button>
		</form>
	</Card>
</main>

<style>
	.auth-shell {
		display: grid;
		min-height: 100dvh;
		place-items: center;
		padding: 16px;
		color: var(--qc-text);
	}

	:global(.auth-card.ui-card) {
		width: min(100%, 440px);
		border-radius: var(--qc-radius-lg);
		padding: clamp(22px, 5vw, 32px);
	}

	.back-link {
		display: inline-flex;
		width: fit-content;
		color: var(--qc-primary);
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--qc-primary-strong);
	}

	.auth-heading {
		margin-top: 28px;
	}

	.section-kicker {
		margin: 0 0 8px;
		color: var(--qc-primary);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 9vw, 3rem);
		line-height: 1.02;
		letter-spacing: -0.025em;
		text-wrap: pretty;
	}

	.auth-heading span {
		display: block;
		margin-top: 12px;
		color: var(--qc-muted);
		line-height: 1.6;
		text-wrap: pretty;
	}

	:global(.form-error.ui-alert) {
		margin-top: 22px;
	}

	.login-form {
		display: grid;
		gap: 16px;
		margin-top: 24px;
	}

	:global(.login-submit.ui-button) {
		width: 100%;
	}
</style>
