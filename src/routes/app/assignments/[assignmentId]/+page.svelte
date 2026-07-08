<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Alert, Badge, Button, Card, LinkButton } from '$lib/components/ui';

	let { data, form } = $props();

	let liveStatus = $state<'connecting' | 'connected' | 'refreshing' | 'offline'>('connecting');

	const eventsEndpoint = $derived(
		resolve('/app/assignments/[assignmentId]/events', { assignmentId: data.assignment.id })
	);
	const assignmentStatusVariant = $derived(
		data.assignment.status === 'closed' ? 'danger' : 'success'
	);

	const refreshSummary = async () => {
		liveStatus = 'refreshing';
		await invalidateAll();
		liveStatus = 'connected';
	};

	onMount(() => {
		const events = new EventSource(eventsEndpoint, { withCredentials: true });
		let refreshTimer: ReturnType<typeof setTimeout> | null = null;

		events.addEventListener('ready', () => {
			liveStatus = 'connected';
		});

		events.addEventListener('change', () => {
			if (refreshTimer) {
				clearTimeout(refreshTimer);
			}

			refreshTimer = setTimeout(() => {
				void refreshSummary();
			}, 120);
		});

		events.onerror = () => {
			liveStatus = 'offline';
		};

		return () => {
			if (refreshTimer) {
				clearTimeout(refreshTimer);
			}

			events.close();
		};
	});
</script>

<svelte:head>
	<title>{data.assignment.title} | QR Assignment Checker</title>
</svelte:head>

<main class="summary-shell">
	<header class="summary-hero">
		<LinkButton variant="ghost" href={resolve('/app/assignments')}>← กลับงานที่ต้องตรวจ</LinkButton>
		<div class="hero-grid">
			<div>
				<p class="section-kicker">สรุปงาน</p>
				<h1>{data.assignment.title}</h1>
				<div class="assignment-meta">
					<span>{data.assignment.subject} · {data.assignment.classCode}</span>
					<Badge variant={assignmentStatusVariant} class="assignment-status">
						{data.assignment.status === 'closed' ? 'ปิดรับแล้ว' : 'เปิดรับอยู่'}
					</Badge>
				</div>
				{#if form?.message}
					<Alert variant="danger" class="form-error">{form.message}</Alert>
				{/if}
			</div>

			<div class="hero-actions">
				{#if data.assignment.status === 'closed'}
					<Button variant="secondary" type="button" disabled class="status-button"
						>ปิดรับแล้ว</Button
					>
				{:else}
					<LinkButton
						variant="primary"
						class="hero-link-action"
						href={resolve('/app/assignments/[assignmentId]/scan', {
							assignmentId: data.assignment.id
						})}>เริ่มสแกน</LinkButton
					>
				{/if}
				<LinkButton
					variant="secondary"
					class="hero-link-action"
					href={resolve('/app/assignments/[assignmentId]/export', {
						assignmentId: data.assignment.id
					})}>ดาวน์โหลด CSV</LinkButton
				>
				<form method="POST" action="?/setStatus" class="status-form">
					<input
						type="hidden"
						name="status"
						value={data.assignment.status === 'closed' ? 'active' : 'closed'}
					/>
					<Button
						variant={data.assignment.status === 'closed' ? 'secondary' : 'danger'}
						type="submit"
						class="status-button"
					>
						{data.assignment.status === 'closed' ? 'เปิดรับใหม่' : 'ปิดรับงาน'}
					</Button>
				</form>
			</div>
		</div>
	</header>

	<section class="metric-strip" aria-label="สรุปผลส่งงาน">
		<Card class="metric-card">
			<strong>{data.summary.rows.length}</strong>
			<span>ทั้งหมด</span>
		</Card>
		<Card class="metric-card submitted">
			<strong>{data.summary.submittedCount}</strong>
			<span>ส่งแล้ว</span>
		</Card>
		<Card class="metric-card missing">
			<strong>{data.summary.missingCount}</strong>
			<span>ยังไม่ส่ง</span>
		</Card>
	</section>

	<Card class="student-status-panel" aria-labelledby="status-title">
		<div class="panel-heading">
			<div>
				<p class="section-kicker">รายชื่อนักเรียน</p>
				<h2 id="status-title">สถานะการส่งงาน</h2>
			</div>
			<div class="live-status" data-live-status={liveStatus}>
				<strong>{liveStatus === 'offline' ? 'Live หลุด' : 'Live'}</strong>
				<span>
					{#if liveStatus === 'connecting'}
						กำลังเชื่อม realtime
					{:else if liveStatus === 'refreshing'}
						กำลังอัปเดต
					{:else if liveStatus === 'offline'}
						refresh เพื่อเชื่อมใหม่
					{:else}
						อัปเดตเมื่อมีการสแกน
					{/if}
				</span>
			</div>
		</div>

		{#if data.summary.rows.length === 0}
			<div class="empty-state">
				<strong>ยังไม่มีนักเรียนในห้อง</strong>
				<span>เพิ่มนักเรียนก่อน แล้ว summary จะพร้อมใช้กับ scanner</span>
			</div>
		{:else}
			<div class="status-rows">
				{#each data.summary.rows as row (row.studentId)}
					<article class:row-submitted={row.status === 'submitted'} class="status-row">
						<div class="student-main">
							<strong>{row.studentNo}</strong>
							<div>
								<span>{row.fullName}</span>
								{#if row.submittedAt}
									<time>{row.submittedAt}</time>
								{/if}
							</div>
						</div>
						<Badge variant={row.status === 'submitted' ? 'success' : 'warning'}>
							{row.status === 'submitted' ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}
						</Badge>
					</article>
				{/each}
			</div>
		{/if}
	</Card>
</main>

<style>
	.summary-shell {
		min-height: 100dvh;
		max-width: 1120px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 32px);
		color: var(--qc-text);
	}

	.summary-hero {
		border: 1px solid var(--qc-border);
		background: color-mix(in srgb, var(--qc-surface) 94%, white);
		box-shadow: var(--qc-shadow);
	}

	.summary-hero {
		border-radius: var(--qc-radius-lg);
		padding: clamp(18px, 4vw, 30px);
	}

	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(210px, auto);
		gap: 20px;
		align-items: end;
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
	h2,
	p {
		text-wrap: pretty;
	}

	h1,
	h2 {
		margin: 0;
		letter-spacing: -0.025em;
	}

	h1 {
		font-size: clamp(2rem, 5vw, 3.3rem);
		line-height: 1.02;
	}

	h2 {
		font-size: clamp(1.18rem, 3vw, 1.55rem);
	}

	.assignment-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 10px;
	}

	.assignment-meta span,
	.panel-heading span,
	.empty-state span {
		display: block;
		color: var(--qc-muted);
		line-height: 1.55;
	}

	.hero-actions {
		display: grid;
		gap: 9px;
		justify-items: stretch;
	}

	.status-form {
		margin: 0;
	}

	:global(.form-error.ui-alert) {
		margin-top: 14px;
	}

	:global(.status-button.ui-button),
	:global(.hero-link-action.ui-link-button) {
		width: 100%;
	}

	.metric-strip {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
		margin-top: 16px;
	}

	:global(.metric-card.ui-card) {
		border-radius: var(--qc-radius-md);
		padding: 18px;
	}

	:global(.metric-card.ui-card) strong,
	:global(.metric-card.ui-card) span {
		display: block;
	}

	:global(.metric-card.ui-card) strong {
		font-size: clamp(2rem, 6vw, 3rem);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	:global(.metric-card.ui-card) span {
		margin-top: 7px;
		color: var(--qc-muted);
		font-weight: 600;
	}

	:global(.metric-card.ui-card.submitted) strong {
		color: var(--qc-success);
	}

	:global(.metric-card.ui-card.missing) strong {
		color: var(--qc-warning);
	}

	:global(.student-status-panel.ui-card) {
		margin-top: 16px;
		border-radius: var(--qc-radius-md);
		padding: 18px;
	}

	.panel-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid var(--qc-border);
		padding-bottom: 14px;
	}

	.live-status {
		display: grid;
		justify-items: end;
		gap: 3px;
		min-width: 150px;
		color: var(--qc-muted);
	}

	.live-status strong {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: var(--qc-success);
		font-size: 0.82rem;
	}

	.live-status strong::before {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--qc-success);
		content: '';
	}

	.live-status[data-live-status='connecting'] strong,
	.live-status[data-live-status='refreshing'] strong {
		color: var(--qc-info);
	}

	.live-status[data-live-status='connecting'] strong::before,
	.live-status[data-live-status='refreshing'] strong::before {
		background: var(--qc-info);
	}

	.live-status[data-live-status='offline'] strong {
		color: var(--qc-danger);
	}

	.live-status[data-live-status='offline'] strong::before {
		background: var(--qc-danger);
	}

	.live-status span {
		font-size: 0.82rem;
		line-height: 1.4;
	}

	.status-rows {
		display: grid;
		gap: 8px;
		margin-top: 14px;
	}

	.status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		border: 1px solid transparent;
		border-radius: 14px;
		background: var(--qc-warning-soft);
		padding: 12px;
	}

	.status-row.row-submitted {
		background: var(--qc-surface-green);
	}

	.student-main {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.student-main > strong {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 12px;
		background: var(--qc-surface);
		color: var(--qc-primary);
		font-variant-numeric: tabular-nums;
		box-shadow: inset 0 0 0 1px var(--qc-border);
	}

	.student-main span,
	.student-main time {
		display: block;
	}

	.student-main span {
		font-weight: 600;
		line-height: 1.25;
	}

	.student-main time {
		margin-top: 3px;
		color: var(--qc-muted);
		font-size: 0.82rem;
		font-variant-numeric: tabular-nums;
	}

	.empty-state {
		margin-top: 14px;
		border: 1px dashed var(--qc-border-strong);
		border-radius: 14px;
		background: color-mix(in srgb, var(--qc-surface) 60%, transparent);
		padding: 22px;
		text-align: center;
	}

	.empty-state strong {
		display: block;
	}

	@media (max-width: 760px) {
		.summary-shell {
			padding: 12px;
		}

		.hero-grid,
		.panel-heading,
		.status-row {
			display: grid;
			grid-template-columns: 1fr;
		}

		.hero-actions,
		:global(.hero-actions .ui-button),
		:global(.hero-actions .ui-link-button) {
			width: 100%;
		}

		.metric-strip {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		:global(.metric-card.ui-card) {
			padding: 14px 10px;
		}

		:global(.metric-card.ui-card) strong {
			font-size: clamp(1.65rem, 10vw, 2.4rem);
		}

		.live-status {
			justify-items: start;
			min-width: 0;
		}

		.student-main {
			align-items: flex-start;
		}
	}
</style>
