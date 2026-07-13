<script lang="ts">
	import Icon from '@iconify/svelte/dist/OfflineIcon.svelte';
	import checkIconModule from '@iconify/icons-lucide/check.js';
	import trashIconModule from '@iconify/icons-lucide/trash-2.js';
	import xIconModule from '@iconify/icons-lucide/x.js';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Alert, AlertDialog, Badge, Button, Card, LinkButton } from '$lib/components/ui';
	import type { IAssignmentSummaryRow, ManualSubmissionTargetStatus } from '$lib/submissions';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface IStudentStatusChange {
		studentId: string;
		studentNo: string;
		fullName: string;
		currentStatus: IAssignmentSummaryRow['status'];
		currentUpdatedAt: string;
		targetStatus: ManualSubmissionTargetStatus;
	}

	let { data, form } = $props();

	let liveStatus = $state<'connecting' | 'connected' | 'refreshing' | 'offline'>('connecting');
	let statusDialogOpen = $state(false);
	let statusPending = $state(false);
	let statusErrorMessage = $state('');
	let selectedStatusChange = $state<IStudentStatusChange | null>(null);
	let statusFormElement = $state<HTMLFormElement>();
	let deleteDialogOpen = $state(false);
	let deleteFormElement = $state<HTMLFormElement>();

	type IIconifyIconData = typeof checkIconModule;
	const resolveIconData = (
		iconModule: IIconifyIconData | { default: IIconifyIconData }
	): IIconifyIconData => ('default' in iconModule ? iconModule.default : iconModule);
	const checkIcon = resolveIconData(checkIconModule);
	const trashIcon = resolveIconData(trashIconModule);
	const xIcon = resolveIconData(xIconModule);

	const eventsEndpoint = $derived(
		resolve('/app/assignments/[assignmentId]/events', { assignmentId: data.assignment.id })
	);
	const assignmentStatusVariant = $derived(
		data.assignment.status === 'closed' ? 'danger' : 'success'
	);
	const statusDialogTitle = $derived(
		selectedStatusChange?.targetStatus === 'submitted'
			? 'ยืนยันว่ารับงานแล้ว?'
			: 'เปลี่ยนกลับเป็นยังไม่ได้ส่ง?'
	);
	const statusDialogDescription = $derived(
		selectedStatusChange?.targetStatus === 'submitted'
			? 'สถานะของนักเรียนจะเปลี่ยนเป็น “ส่งแล้ว” และบันทึกว่าครูเป็นผู้ปรับสถานะ'
			: data.assignment.status === 'closed'
				? 'รายการนี้จะถูกยกเลิกจากสรุปผู้ส่งงาน หลังครูเปิดรับใหม่ นักเรียนจึงจะสแกน QR เพื่อส่งใหม่ได้'
				: 'รายการนี้จะถูกยกเลิกจากสรุปผู้ส่งงาน แต่นักเรียนยังสามารถสแกน QR เพื่อส่งใหม่ได้'
	);

	const refreshSummary = async () => {
		liveStatus = 'refreshing';
		await invalidateAll();
		liveStatus = 'connected';
	};

	const formatStatusTime = (value: string): string => {
		if (!value) return '';

		return new Intl.DateTimeFormat('th-TH', {
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(new Date(value));
	};

	const openStatusDialog = (
		row: IAssignmentSummaryRow,
		targetStatus: ManualSubmissionTargetStatus
	): void => {
		if (row.status === targetStatus || statusPending) return;

		selectedStatusChange = {
			studentId: row.studentId,
			studentNo: row.studentNo,
			fullName: row.fullName,
			currentStatus: row.status,
			currentUpdatedAt: row.statusUpdatedAt,
			targetStatus
		};
		statusErrorMessage = '';
		statusDialogOpen = true;
	};

	const confirmStatusChange = (): void => {
		if (!selectedStatusChange || statusPending) return;

		statusFormElement?.requestSubmit();
	};

	const confirmDeleteAssignment = (): void => {
		deleteFormElement?.requestSubmit();
	};

	const enhanceStatusForm: SubmitFunction = () => {
		statusPending = true;

		return async ({ result, update }) => {
			try {
				await update({ reset: false });

				if (result.type === 'success') {
					statusDialogOpen = false;
					selectedStatusChange = null;
					statusErrorMessage = '';
				} else if (result.type === 'failure') {
					const resultData = result.data as { message?: string } | undefined;
					statusErrorMessage = resultData?.message || 'ปรับสถานะการส่งงานไม่สำเร็จ';
				}
			} finally {
				statusPending = false;
			}
		};
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
				{#if form?.message && form?.formName !== 'studentSubmissionStatus'}
					<Alert
						variant={form?.formName === 'studentSubmissionStatus' && form?.statusResult
							? 'success'
							: 'danger'}
						class="form-error"
					>
						{form.message}
					</Alert>
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
					<article
						class:row-submitted={row.status === 'submitted'}
						class:is-pending={statusPending && selectedStatusChange?.studentId === row.studentId}
						class="status-row"
						aria-busy={statusPending && selectedStatusChange?.studentId === row.studentId}
					>
						<div class="student-main">
							<strong>{row.studentNo}</strong>
							<div>
								<span>{row.fullName}</span>
								{#if row.statusUpdatedAt}
									<time>
										{row.statusSource === 'camera' ? 'สแกน QR' : 'ครูปรับสถานะ'} ·
										{formatStatusTime(row.statusUpdatedAt)}
									</time>
								{/if}
							</div>
						</div>
						<div class="status-control">
							<div
								class="status-segmented"
								role="group"
								aria-label={`ปรับสถานะการส่งงานของ ${row.fullName}`}
							>
								<button
									type="button"
									class:is-active={row.status === 'missing'}
									aria-pressed={row.status === 'missing'}
									disabled={row.status === 'missing' || statusPending}
									onclick={() => openStatusDialog(row, 'missing')}
								>
									<Icon icon={xIcon} width="18" height="18" aria-hidden="true" />
									ยังไม่ได้ส่ง
								</button>
								<button
									type="button"
									class:is-active={row.status === 'submitted'}
									aria-pressed={row.status === 'submitted'}
									disabled={row.status === 'submitted' || statusPending}
									onclick={() => openStatusDialog(row, 'submitted')}
								>
									<Icon icon={checkIcon} width="18" height="18" aria-hidden="true" />
									ส่งแล้ว
								</button>
							</div>
							{#if statusPending && selectedStatusChange?.studentId === row.studentId}
								<span class="status-pending" role="status">กำลังบันทึกสถานะ…</span>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</Card>

	<Card class="danger-zone" aria-labelledby="danger-zone-title">
		<div>
			<p class="section-kicker danger-kicker">จัดการใบงาน</p>
			<h2 id="danger-zone-title">ลบใบงาน</h2>
			<span>ย้ายไปถังขยะโดยไม่ลบประวัติการส่งงาน และสามารถกู้คืนได้</span>
		</div>
		<Button type="button" variant="danger" size="lg" onclick={() => (deleteDialogOpen = true)}>
			<Icon icon={trashIcon} width="18" height="18" aria-hidden="true" />
			ลบใบงาน
		</Button>
	</Card>

	<form
		bind:this={statusFormElement}
		method="POST"
		action="?/setStudentSubmissionStatus"
		use:enhance={enhanceStatusForm}
		class="manual-status-form"
	>
		<input type="hidden" name="studentId" value={selectedStatusChange?.studentId || ''} />
		<input type="hidden" name="expectedStatus" value={selectedStatusChange?.currentStatus || ''} />
		<input
			type="hidden"
			name="expectedUpdatedAt"
			value={selectedStatusChange?.currentUpdatedAt || ''}
		/>
		<input type="hidden" name="targetStatus" value={selectedStatusChange?.targetStatus || ''} />
	</form>

	<form
		bind:this={deleteFormElement}
		method="POST"
		action="?/deleteAssignment"
		class="delete-assignment-form"
	></form>

	{#snippet statusConfirmIcon()}
		<Icon
			icon={selectedStatusChange?.targetStatus === 'submitted' ? checkIcon : xIcon}
			width="18"
			height="18"
			aria-hidden="true"
		/>
	{/snippet}

	{#snippet deleteConfirmIcon()}
		<Icon icon={trashIcon} width="18" height="18" aria-hidden="true" />
	{/snippet}

	<AlertDialog
		bind:open={statusDialogOpen}
		title={statusDialogTitle}
		description={statusDialogDescription}
		cancelLabel="ยกเลิก"
		confirmLabel={selectedStatusChange?.targetStatus === 'submitted'
			? 'ยืนยันส่งแล้ว'
			: 'เปลี่ยนเป็นยังไม่ได้ส่ง'}
		confirmVariant={selectedStatusChange?.targetStatus === 'submitted' ? 'primary' : 'danger'}
		confirmIcon={statusConfirmIcon}
		pending={statusPending}
		pendingLabel="กำลังบันทึก…"
		closeOnConfirm={false}
		onconfirm={confirmStatusChange}
	>
		{#if selectedStatusChange}
			<div class="status-dialog-student">
				<strong>เลขที่ {selectedStatusChange.studentNo} · {selectedStatusChange.fullName}</strong>
				<span>งาน: {data.assignment.title}</span>
			</div>
		{/if}
		{#if statusErrorMessage}
			<Alert variant="danger" class="status-dialog-error">{statusErrorMessage}</Alert>
		{/if}
	</AlertDialog>

	<AlertDialog
		bind:open={deleteDialogOpen}
		title="ลบใบงานนี้?"
		description="ใบงานจะถูกย้ายไปถังขยะ ประวัติการส่งงานจะไม่หาย และสามารถกู้คืนได้"
		cancelLabel="ยกเลิก"
		confirmLabel="ย้ายไปถังขยะ"
		confirmVariant="danger"
		confirmIcon={deleteConfirmIcon}
		onconfirm={confirmDeleteAssignment}
	>
		<div class="delete-dialog-assignment">
			<strong>{data.assignment.title}</strong>
			<span>ส่งแล้ว {data.summary.submittedCount} จาก {data.summary.rows.length} คน</span>
		</div>
	</AlertDialog>
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

	.status-row.is-pending {
		border-color: var(--qc-primary);
	}

	.status-control {
		display: grid;
		justify-items: end;
		gap: 5px;
	}

	.status-pending {
		color: var(--qc-primary);
		font-size: 0.78rem;
	}

	.status-segmented {
		display: inline-grid;
		grid-template-columns: repeat(2, minmax(94px, 1fr));
		gap: 3px;
		border: 1px solid var(--qc-border-strong);
		border-radius: var(--qc-radius-md);
		background: var(--qc-bg-soft);
		padding: 3px;
	}

	.status-segmented button {
		display: inline-flex;
		min-height: 44px;
		align-items: center;
		justify-content: center;
		gap: 7px;
		border: 1px solid transparent;
		border-radius: var(--qc-radius-sm);
		background: transparent;
		color: var(--qc-muted);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
	}

	.status-segmented button:hover:not(:disabled) {
		border-color: var(--qc-border-strong);
		background: var(--qc-surface);
		color: var(--qc-text);
	}

	.status-segmented button:first-child.is-active {
		border-color: color-mix(in srgb, var(--qc-warning) 38%, var(--qc-border));
		background: var(--qc-warning-soft);
		color: color-mix(in srgb, var(--qc-warning) 78%, var(--qc-text));
	}

	.status-segmented button:last-child.is-active {
		border-color: color-mix(in srgb, var(--qc-primary) 24%, var(--qc-border));
		background: var(--qc-surface-green);
		color: var(--qc-success);
	}

	.status-segmented button:disabled {
		cursor: default;
	}

	.manual-status-form {
		display: none;
	}

	.delete-assignment-form {
		display: none;
	}

	:global(.danger-zone.ui-card) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		margin-top: 16px;
		border-color: color-mix(in srgb, var(--qc-danger) 24%, var(--qc-border));
		border-radius: var(--qc-radius-md);
		padding: 18px;
	}

	:global(.danger-zone.ui-card) h2 {
		margin: 0;
	}

	:global(.danger-zone.ui-card) span {
		display: block;
		margin-top: 5px;
		color: var(--qc-muted);
		line-height: 1.5;
	}

	.danger-kicker {
		color: var(--qc-danger);
	}

	.status-dialog-student {
		display: grid;
		gap: 4px;
		margin-top: 14px;
		border: 1px solid var(--qc-border);
		border-radius: var(--qc-radius-md);
		background: var(--qc-bg);
		padding: 12px;
	}

	.status-dialog-student strong,
	.status-dialog-student span {
		display: block;
	}

	.status-dialog-student strong {
		color: var(--qc-text);
	}

	.delete-dialog-assignment {
		display: grid;
		gap: 4px;
		margin-top: 14px;
		border: 1px solid color-mix(in srgb, var(--qc-danger) 20%, var(--qc-border));
		border-radius: var(--qc-radius-md);
		background: var(--qc-danger-soft);
		padding: 12px;
	}

	.delete-dialog-assignment strong,
	.delete-dialog-assignment span {
		display: block;
	}

	:global(.status-dialog-error.ui-alert) {
		margin-top: 10px;
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

		.status-control,
		.status-segmented {
			width: 100%;
		}

		.status-control {
			justify-items: stretch;
		}

		:global(.danger-zone.ui-card) {
			display: grid;
		}

		:global(.danger-zone.ui-card .ui-button) {
			width: 100%;
		}
	}
</style>
