<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert, Button, Card } from '$lib/components/ui';

	let { data } = $props();
</script>

<svelte:head>
	<title>พิมพ์ QR นักเรียน | QR Assignment Checker</title>
</svelte:head>

<main class="print-shell">
	<Card class="print-toolbar" aria-label="เครื่องมือพิมพ์">
		<div>
			<a href={resolve('/app/students')}>← กลับรายชื่อนักเรียน</a>
			<p class="section-kicker">การ์ด QR</p>
			<h1>พิมพ์ QR นักเรียน</h1>
			{#if data.classRecord}
				<p>{data.classRecord.name} · {data.classRecord.subject} · {data.classRecord.class_code}</p>
			{/if}
		</div>

		<Button type="button" onclick={() => window.print()} class="print-button">พิมพ์การ์ด</Button>
	</Card>

	{#if data.unavailable}
		<Alert variant="warning" class="notice">
			<strong>PocketBase ยังไม่พร้อม</strong>
			<span>รัน `pnpm pb:serve` แล้วกลับมา refresh หน้านี้อีกครั้ง</span>
		</Alert>
	{:else if data.cards.length === 0}
		<Alert variant="info" class="notice">
			<strong>ยังไม่มีนักเรียนสำหรับพิมพ์ QR</strong>
			<span>กลับไปเพิ่มนักเรียนก่อน แล้วค่อยพิมพ์การ์ด</span>
		</Alert>
	{:else}
		<section class="card-grid" aria-label="QR cards">
			{#each data.cards as student (student.id)}
				<article class="qr-card">
					<div class="card-heading">
						<span>เลขที่ {student.studentNo}</span>
						<strong>{student.fullName}</strong>
					</div>

					<img src={student.qrImageDataUrl} alt={`QR ของ ${student.fullName}`} />

					<code>{student.qrPayload}</code>
				</article>
			{/each}
		</section>
	{/if}
</main>

<style>
	.print-shell {
		min-height: 100dvh;
		padding: clamp(16px, 3vw, 32px);
		color: var(--qc-text);
	}

	:global(.print-toolbar.ui-card) {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20px;
		max-width: 1120px;
		margin: 0 auto 20px;
		border-radius: var(--qc-radius-lg);
		padding: clamp(18px, 4vw, 30px);
	}

	:global(.print-toolbar.ui-card) a {
		display: inline-flex;
		width: fit-content;
		color: var(--qc-primary);
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
	}

	:global(.print-toolbar.ui-card) a:hover {
		color: var(--qc-primary-strong);
	}

	.section-kicker {
		margin: 24px 0 8px;
		color: var(--qc-primary);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	h1 {
		margin: 18px 0 0;
		font-size: clamp(2rem, 5vw, 3.25rem);
		line-height: 1;
		letter-spacing: -0.05em;
	}

	:global(.print-toolbar.ui-card) p {
		margin: 12px 0 0;
		color: var(--qc-muted);
	}
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 14px;
		max-width: 1120px;
		margin: 0 auto;
	}

	.qr-card {
		display: grid;
		gap: 12px;
		break-inside: avoid;
		border: 1px solid var(--qc-border-strong);
		border-radius: 18px;
		background: var(--qc-surface);
		padding: 16px;
		text-align: center;
	}

	.card-heading span,
	.card-heading strong {
		display: block;
	}

	.card-heading span {
		color: var(--qc-primary);
		font-size: 0.85rem;
		font-weight: 800;
	}

	.card-heading strong {
		margin-top: 4px;
		font-size: 1.15rem;
	}

	img {
		width: min(100%, 180px);
		height: auto;
		margin: 0 auto;
	}

	code {
		color: var(--qc-muted);
		font-size: 0.72rem;
		word-break: break-all;
	}

	@media (max-width: 720px) {
		:global(.print-toolbar.ui-card) {
			display: grid;
		}
	}

	@media print {
		:global(body) {
			background: var(--qc-surface);
		}

		.print-shell {
			padding: 0;
			background: var(--qc-surface);
		}

		:global(.print-toolbar.ui-card) {
			display: none;
		}

		.card-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 10mm;
			max-width: none;
		}

		.qr-card {
			border-color: var(--qc-text);
			border-radius: 8px;
			box-shadow: none;
			padding: 8mm;
		}
	}
</style>
