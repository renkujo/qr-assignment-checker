<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card, LinkButton } from '$lib/components/ui';
</script>

<svelte:head>
	<title>QR Assignment Checker</title>
</svelte:head>

<main class="page-shell">
	<Card class="hero-card" aria-labelledby="page-title">
		<p class="section-kicker">ระบบเช็คส่งงานสำหรับครู</p>
		<h1 id="page-title">เช็คการส่งงานด้วย QR Code</h1>
		<p class="lede">
			จัดรายชื่อนักเรียน สร้างงาน สแกน QR ผ่านมือถือ และดูว่าใครส่งแล้วแบบ realtime
		</p>

		<div class="feature-grid" aria-label="ความสามารถหลัก">
			<div>
				<strong>รายชื่อ + QR</strong>
				<span>เพิ่มนักเรียนแล้วพิมพ์ QR ทั้งห้อง</span>
			</div>
			<div>
				<strong>งานที่ต้องตรวจ</strong>
				<span>สร้างงาน เปิดสแกน และปิดรับงานได้</span>
			</div>
			<div>
				<strong>สรุป realtime</strong>
				<span>เห็นส่งแล้ว/ยังไม่ส่ง และ export CSV</span>
			</div>
		</div>

		<div class="hero-actions">
			<LinkButton variant="primary" size="lg" href={resolve('/login')}>เข้าสู่ระบบครู</LinkButton>
			<LinkButton variant="secondary" size="lg" href={resolve('/app')}>ไปที่ workspace</LinkButton>
		</div>
	</Card>
</main>

<style>
	.page-shell {
		display: grid;
		min-height: 100dvh;
		place-items: center;
		padding: 16px;
		color: var(--qc-text);
	}

	:global(.hero-card.ui-card) {
		width: min(100%, 760px);
		border-radius: var(--qc-radius-lg);
		padding: clamp(24px, 6vw, 52px);
	}

	.section-kicker {
		margin: 0 0 10px;
		color: var(--qc-primary);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.25rem, 7vw, 4.5rem);
		line-height: 0.98;
		letter-spacing: -0.025em;
		text-wrap: pretty;
	}

	.lede {
		max-width: 58ch;
		margin: 18px 0 0;
		color: var(--qc-muted);
		font-size: clamp(1rem, 2.5vw, 1.18rem);
		line-height: 1.75;
		text-wrap: pretty;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
		margin-top: 28px;
	}

	.feature-grid div {
		border: 1px solid var(--qc-border);
		border-radius: var(--qc-radius-sm);
		background: var(--qc-surface-green);
		padding: 14px;
	}

	.feature-grid strong,
	.feature-grid span {
		display: block;
	}

	.feature-grid span {
		margin-top: 6px;
		color: var(--qc-muted);
		font-size: 0.86rem;
		line-height: 1.5;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 26px;
	}

	@media (max-width: 680px) {
		.feature-grid {
			grid-template-columns: 1fr;
		}

		:global(.hero-actions .ui-link-button) {
			width: 100%;
		}
	}
</style>
