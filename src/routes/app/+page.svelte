<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Card } from '$lib/components/ui';

	let { data } = $props();

	const teacherName = $derived(data.user.name || data.user.email);
</script>

<svelte:head>
	<title>พื้นที่ทำงานครู | QR Assignment Checker</title>
</svelte:head>

<main class="app-shell">
	<Card class="top-card" aria-labelledby="workspace-title">
		<div>
			<p class="section-kicker">พื้นที่ทำงานครู</p>
			<h1 id="workspace-title">สวัสดี {teacherName}</h1>
			<p class="lede">เลือกงานที่ต้องทำตอนนี้: จัดรายชื่อ สร้างงาน หรือเปิดงานเพื่อเริ่มสแกน</p>
		</div>

		<form method="POST" action="?/logout">
			<Button variant="secondary" type="submit" class="logout-button">ออกจากระบบ</Button>
		</form>
	</Card>

	<section class="workspace-grid" aria-label="งานหลัก">
		<a class="workspace-card" href={resolve('/app/students')}>
			<span class="card-index">01</span>
			<strong>รายชื่อนักเรียน</strong>
			<span>เพิ่มนักเรียนและพิมพ์ QR ทั้งห้อง</span>
		</a>

		<a class="workspace-card workspace-card-primary" href={resolve('/app/assignments')}>
			<span class="card-index">02</span>
			<strong>งานที่ต้องตรวจ</strong>
			<span>สร้างงาน ดูสรุป และเริ่มสแกนส่งงาน</span>
		</a>

		<article class="workspace-card workspace-card-muted">
			<span class="card-index">03</span>
			<strong>สแกน QR</strong>
			<span>เปิดจากหน้างานที่ต้องตรวจ เพื่อให้ระบบรู้ว่าจะบันทึกงานไหน</span>
		</article>
	</section>
</main>

<style>
	.app-shell {
		min-height: 100dvh;
		max-width: 1120px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 32px);
		color: var(--qc-text);
	}

	:global(.top-card.ui-card) {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 24px;
		border-radius: var(--qc-radius-lg);
		padding: clamp(18px, 4vw, 30px);
	}

	.section-kicker {
		margin: 0 0 8px;
		color: var(--qc-primary);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	h1,
	p {
		text-wrap: pretty;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.3rem);
		line-height: 1.02;
		letter-spacing: -0.025em;
	}

	.lede {
		max-width: 54ch;
		margin: 12px 0 0;
		color: var(--qc-muted);
		font-size: 1.02rem;
		line-height: 1.65;
	}

	:global(.logout-button.ui-button) {
		white-space: nowrap;
	}

	.workspace-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 14px;
		margin-top: 16px;
	}

	.workspace-card {
		display: grid;
		align-content: start;
		gap: 10px;
		min-height: 172px;
		border: 1px solid var(--qc-border);
		border-radius: var(--qc-radius-md);
		background: color-mix(in srgb, var(--qc-surface) 94%, white);
		padding: 18px;
		color: inherit;
		text-decoration: none;
		box-shadow: var(--qc-shadow);
	}

	.workspace-card:hover {
		border-color: color-mix(in srgb, var(--qc-primary) 22%, var(--qc-border));
		background: var(--qc-surface-green);
	}

	.workspace-card-primary {
		background: var(--qc-surface-green);
	}

	.workspace-card-muted {
		background: color-mix(in srgb, var(--qc-surface) 82%, var(--qc-bg-soft));
		color: var(--qc-muted);
	}

	.card-index {
		width: fit-content;
		border-radius: 999px;
		background: var(--qc-primary-soft);
		padding: 5px 9px;
		color: var(--qc-primary);
		font-size: 0.78rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.workspace-card strong,
	.workspace-card span {
		display: block;
	}

	.workspace-card strong {
		font-size: clamp(1.25rem, 3vw, 1.65rem);
		line-height: 1.2;
	}

	.workspace-card span:last-child {
		color: var(--qc-muted);
		line-height: 1.55;
	}

	@media (max-width: 760px) {
		.app-shell {
			padding: 12px;
		}

		:global(.top-card.ui-card) {
			display: grid;
		}

		.workspace-grid {
			grid-template-columns: 1fr;
		}

		.workspace-card {
			min-height: 0;
		}
	}
</style>
