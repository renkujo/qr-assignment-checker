<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { Alert, Badge, Button, Card, LinkButton } from '$lib/components/ui';
	import { rememberScanPayload } from '$lib/qr/scan-payload-cooldown';
	import type { Html5Qrcode } from 'html5-qrcode';
	import { toast } from 'svelte-sonner';
	import type { IScanSubmissionResult } from '$lib/submissions';

	let { data } = $props();

	let scanner: Html5Qrcode | null = null;
	let scannerReady = $state(false);
	let scannerRunning = $state(false);
	let pending = $state(false);
	let cameraError = $state('');
	let result = $state<IScanSubmissionResult | null>(null);
	const recentPayloads = new SvelteMap<string, number>();

	const scanEndpoint = $derived(
		resolve('/app/assignments/[assignmentId]/scan/submit', { assignmentId: data.assignment.id })
	);
	const resultTone = $derived(result?.status || 'idle');
	const resultBadgeVariant = $derived(
		result?.status === 'submitted'
			? 'success'
			: result?.status === 'duplicate'
				? 'warning'
				: result?.status
					? 'danger'
					: 'info'
	);

	const getCameraReadinessError = (): string => {
		if (!window.isSecureContext) {
			return 'มือถือจะเปิดกล้องได้เมื่อเข้าเว็บผ่าน HTTPS หรือ localhost เท่านั้น ให้เปิดผ่าน HTTPS tunnel เช่น cloudflared/ngrok';
		}

		if (!navigator.mediaDevices?.getUserMedia) {
			return 'browser นี้ยังไม่รองรับการเปิดกล้องผ่านเว็บ ลองใช้ Chrome หรือ Safari รุ่นล่าสุด';
		}

		return '';
	};

	const stopScanner = async () => {
		if (!scanner || !scannerRunning) {
			return;
		}

		try {
			await scanner.stop();
		} finally {
			scannerRunning = false;
		}
	};

	const showScanToast = (scanResult: IScanSubmissionResult) => {
		const description = scanResult.studentName
			? `เลขที่ ${scanResult.studentNo} · ${scanResult.studentName}`
			: undefined;

		if (scanResult.status === 'submitted') {
			toast.success(scanResult.message, { description });
			return;
		}

		if (scanResult.status === 'duplicate') {
			toast.warning(scanResult.message, { description });
			return;
		}

		toast.error(scanResult.message, { description });
	};

	const submitScan = async (qrPayload: string) => {
		if (pending || !rememberScanPayload({ recentPayloads, payload: qrPayload })) {
			return;
		}

		pending = true;

		try {
			const response = await fetch(scanEndpoint, {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ qrPayload })
			});
			const payload = (await response.json()) as IScanSubmissionResult;
			result = payload;
			showScanToast(payload);
		} catch {
			result = {
				status: 'invalid',
				message: 'เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง'
			};
			showScanToast(result);
		} finally {
			pending = false;
		}
	};

	const startScanner = async () => {
		if (scannerRunning || pending) {
			return;
		}

		cameraError = '';

		const readinessError = getCameraReadinessError();

		if (readinessError) {
			cameraError = readinessError;
			return;
		}

		try {
			const { Html5Qrcode } = await import('html5-qrcode');
			scanner = scanner || new Html5Qrcode('qr-reader', false);
			await scanner.start(
				{ facingMode: 'environment' },
				{ fps: 8, qrbox: { width: 240, height: 240 } },
				(decodedText) => {
					void submitScan(decodedText);
				},
				() => undefined
			);
			scannerRunning = true;
			scannerReady = true;
		} catch (error) {
			cameraError = `เปิดกล้องไม่ได้ ตรวจ permission หรือเปิดผ่าน HTTPS/localhost (${error instanceof Error ? error.message : 'camera error'})`;
			scannerRunning = false;
		}
	};

	onMount(() => {
		void startScanner();

		return () => {
			recentPayloads.clear();
			void stopScanner();
		};
	});
</script>

<svelte:head>
	<title>สแกนงาน | {data.assignment.title}</title>
</svelte:head>

<main class="scan-shell">
	<header class="scan-hero">
		<LinkButton
			variant="ghost"
			href={resolve('/app/assignments/[assignmentId]', { assignmentId: data.assignment.id })}
		>
			← กลับสรุปงาน
		</LinkButton>
		<div class="hero-content">
			<div>
				<p class="section-kicker">สแกนส่งงาน</p>
				<h1>{data.assignment.title}</h1>
				<p class="scan-meta">
					{data.assignment.subject} · ส่งแล้ว {data.summary.submittedCount}/{data.summary.rows
						.length}
				</p>
			</div>
			<Badge variant={pending ? 'info' : scannerRunning ? 'success' : 'muted'}>
				{pending ? 'กำลังบันทึก' : scannerRunning ? 'สแกนต่อเนื่อง' : 'พร้อมเริ่ม'}
			</Badge>
		</div>
	</header>

	<section class="scan-layout">
		<Card class="scanner-card">
			<div class="scanner-frame" aria-busy={pending}>
				<div id="qr-reader" class:scanner-ready={scannerReady}></div>
				{#if pending}
					<div class="scan-loading" role="status" aria-live="polite">
						<span class="scan-spinner" aria-hidden="true"></span>
						<strong>กำลังบันทึกผลสแกน…</strong>
					</div>
				{/if}
			</div>

			{#if cameraError}
				<Alert variant="danger" class="camera-alert">{cameraError}</Alert>
			{/if}

			<div class="scanner-actions">
				<Button size="lg" onclick={startScanner} disabled={scannerRunning || pending}
					>เริ่มสแกน</Button
				>
				<Button variant="secondary" size="lg" onclick={stopScanner} disabled={!scannerRunning}
					>หยุดกล้อง</Button
				>
			</div>
		</Card>

		<Card class="result-card" data-tone={resultTone} aria-live="polite">
			<p class="section-kicker">ผลล่าสุด</p>
			{#if result}
				<Badge variant={resultBadgeVariant}>
					{result.status === 'submitted'
						? 'บันทึกแล้ว'
						: result.status === 'duplicate'
							? 'สแกนซ้ำ'
							: 'ตรวจสอบอีกครั้ง'}
				</Badge>
				<strong>{result.message}</strong>
				{#if result.studentName}
					<span>เลขที่ {result.studentNo} · {result.studentName}</span>
				{/if}
				{#if result.submittedAt}
					<time>{result.submittedAt}</time>
				{/if}
			{:else}
				<Badge variant="info">รอ QR</Badge>
				<strong>ถือ QR ให้อยู่ในกรอบ</strong>
				<span>เมื่อบันทึกเสร็จ ระบบจะพร้อมรับ QR คนถัดไปโดยอัตโนมัติ</span>
			{/if}
		</Card>
	</section>
</main>

<style>
	.scan-shell {
		min-height: 100dvh;
		max-width: 1120px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 32px);
		color: var(--qc-text);
	}

	.scan-hero {
		border: 1px solid var(--qc-border);
		border-radius: var(--qc-radius-lg);
		background: color-mix(in srgb, var(--qc-surface) 94%, white);
		padding: clamp(18px, 4vw, 30px);
		box-shadow: var(--qc-shadow);
	}

	.hero-content {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 18px;
		margin-top: 22px;
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

	.scan-meta {
		margin: 10px 0 0;
		color: var(--qc-muted);
		font-weight: 500;
		line-height: 1.5;
	}

	.scan-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
		gap: 16px;
		margin-top: 16px;
	}

	:global(.scanner-card.ui-card),
	:global(.result-card.ui-card) {
		padding: 18px;
	}

	.scanner-frame {
		position: relative;
		overflow: hidden;
		border-radius: 18px;
		background: #101820;
	}

	.scan-loading {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 12px;
		background: rgb(16 24 32 / 72%);
		color: #ffffff;
		text-align: center;
		pointer-events: none;
		backdrop-filter: blur(2px);
	}

	.scan-spinner {
		width: 34px;
		height: 34px;
		border: 3px solid rgb(255 255 255 / 30%);
		border-top-color: #ffffff;
		border-radius: 999px;
		animation: scan-spin 0.7s linear infinite;
	}

	@keyframes scan-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scan-spinner {
			animation-duration: 1.4s;
		}
	}

	#qr-reader {
		min-height: min(68vh, 560px);
		overflow: hidden;
		border: 2px dashed color-mix(in srgb, var(--qc-primary) 32%, white);
		border-radius: 18px;
		background: #101820;
	}

	#qr-reader.scanner-ready {
		border-style: solid;
	}

	:global(.camera-alert.ui-alert) {
		margin-top: 12px;
	}

	.scanner-actions {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 10px;
		margin-top: 12px;
	}

	:global(.result-card.ui-card) {
		display: grid;
		align-self: start;
		gap: 12px;
	}

	:global(.result-card.ui-card) strong,
	:global(.result-card.ui-card) span,
	:global(.result-card.ui-card) time {
		display: block;
	}

	:global(.result-card.ui-card) strong {
		font-size: clamp(1.35rem, 3vw, 2rem);
		line-height: 1.18;
	}

	:global(.result-card.ui-card) span,
	:global(.result-card.ui-card) time {
		color: var(--qc-muted);
		line-height: 1.55;
	}

	:global(.result-card.ui-card) time {
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
	}

	:global(.result-card.ui-card[data-tone='submitted']) {
		background: var(--qc-success-soft);
	}

	:global(.result-card.ui-card[data-tone='duplicate']) {
		background: var(--qc-warning-soft);
	}

	:global(.result-card.ui-card[data-tone='invalid']) {
		background: var(--qc-danger-soft);
	}

	@media (max-width: 760px) {
		.scan-shell {
			padding: 12px;
		}

		.hero-content,
		.scan-layout {
			display: grid;
			grid-template-columns: 1fr;
		}

		.scan-layout {
			gap: 12px;
		}

		#qr-reader {
			min-height: 56vh;
		}

		.scanner-actions {
			grid-template-columns: 1fr;
		}

		:global(.result-card.ui-card) {
			order: -1;
		}
	}
</style>
