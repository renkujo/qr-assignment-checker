<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert, Badge, Button, Input, Label, LinkButton, Textarea } from '$lib/components/ui';

	let { data, form } = $props();

	const studentCount = $derived(data.students.length);
	const importResultRows = $derived(form?.importResult?.rows || []);
</script>

<svelte:head>
	<title>รายชื่อนักเรียน | QR Assignment Checker</title>
</svelte:head>

<main class="students-shell">
	<header class="roster-hero">
		<LinkButton variant="ghost" href={resolve('/app')}>← กลับ workspace</LinkButton>
		<div class="hero-grid">
			<div class="hero-copy">
				<p class="section-kicker">ห้องเรียน</p>
				<h1>รายชื่อนักเรียน</h1>
				{#if data.classRecord}
					<p class="class-meta">
						{data.classRecord.name} · {data.classRecord.subject} · {data.classRecord.class_code}
					</p>
				{:else}
					<p class="class-meta">ยังโหลดข้อมูลห้องไม่ได้</p>
				{/if}
			</div>

			<div class="hero-actions" aria-label="จัดการรายชื่อ">
				<LinkButton variant="secondary" href={resolve('/app/assignments')}
					>ดูงานที่ต้องตรวจ</LinkButton
				>
				<LinkButton variant="primary" href={resolve('/app/students/print')}
					>พิมพ์ QR ทั้งห้อง</LinkButton
				>
			</div>
		</div>
	</header>

	{#if data.unavailable}
		<Alert variant="warning" class="notice">
			<strong>PocketBase ยังไม่พร้อม</strong>
			<span>รัน `pnpm pb:serve` แล้วกลับมา refresh หน้านี้อีกครั้ง</span>
		</Alert>
	{:else}
		<section class="roster-layout">
			<aside class="roster-tools" aria-label="เพิ่มและนำเข้ารายชื่อ">
				<form
					method="POST"
					action="?/create"
					class="student-form"
					aria-labelledby="add-student-title"
				>
					<div class="panel-heading">
						<p class="section-kicker">เพิ่มรายชื่อ</p>
						<h2 id="add-student-title">เพิ่มนักเรียน</h2>
						<span>ใช้เลขที่กับชื่อจริงพอสำหรับ MVP นี้</span>
					</div>

					{#if form?.formName === 'create' && form?.message}
						<Alert variant="danger" class="form-error">{form.message}</Alert>
					{/if}

					<Label>
						<span>เลขที่</span>
						<Input name="studentNo" value={form?.studentNo || ''} inputmode="numeric" required />
					</Label>

					<Label>
						<span>ชื่อ-นามสกุล</span>
						<Input name="fullName" value={form?.fullName || ''} autocomplete="name" required />
					</Label>

					<Button type="submit" class="form-submit">บันทึกนักเรียน</Button>
				</form>

				<form method="POST" action="?/import" class="import-form" aria-labelledby="import-title">
					<div class="panel-heading">
						<p class="section-kicker">นำเข้าหลายคน</p>
						<h2 id="import-title">Import รายชื่อ</h2>
						<span>copy จาก Excel / Google Sheets แล้ววางได้เลย สูงสุด 100 แถวต่อครั้ง</span>
					</div>

					{#if form?.formName === 'import' && form?.message}
						<Alert
							variant={form?.importResult?.createdCount ? 'success' : 'warning'}
							class="form-error"
						>
							{form.message}
						</Alert>
					{/if}

					<Label>
						<span>รายชื่อที่ต้องการนำเข้า</span>
						<Textarea
							name="importText"
							value={form?.formName === 'import' ? form?.importText || '' : ''}
							placeholder="เลขที่,ชื่อ-นามสกุล\n1,เด็กชายเอ\n2,เด็กหญิงบี"
						/>
					</Label>

					<div class="import-example" aria-label="ตัวอย่าง import">
						<strong>รูปแบบที่รองรับ</strong>
						<code>เลขที่,ชื่อ-นามสกุล</code>
						<code>1,เด็กชายเอ</code>
						<code>2,เด็กหญิงบี</code>
					</div>

					<Button type="submit" class="form-submit">นำเข้ารายชื่อ</Button>

					{#if form?.formName === 'import' && form?.importResult}
						<div class="import-result" aria-live="polite">
							<div class="import-result-summary">
								<Badge variant="success">เพิ่ม {form.importResult.createdCount} คน</Badge>
								<Badge variant={form.importResult.skippedCount ? 'warning' : 'muted'}>
									ข้าม {form.importResult.skippedCount} แถว
								</Badge>
							</div>

							{#if importResultRows.length > 0}
								<div class="import-result-rows">
									{#each importResultRows.slice(0, 8) as row (row.rowNumber)}
										<div class="import-result-row" data-status={row.status}>
											<span>แถว {row.rowNumber}</span>
											<strong>{row.studentNo || '—'} {row.fullName}</strong>
											<small>{row.status === 'created' ? 'เพิ่มแล้ว' : row.reason}</small>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</form>
			</aside>

			<section class="student-list" aria-labelledby="student-list-title">
				<div class="list-heading">
					<div>
						<p class="section-kicker">รายชื่อในห้อง</p>
						<h2 id="student-list-title">นักเรียน {studentCount} คน</h2>
					</div>
					<span>พร้อมพิมพ์ QR สำหรับสแกนส่งงาน</span>
				</div>

				{#if data.students.length === 0}
					<div class="empty-state">
						<strong>ยังไม่มีนักเรียนในห้องนี้</strong>
						<span>เพิ่มรายชื่อ 2-3 คนก่อน แล้วค่อยพิมพ์ QR เพื่อทดสอบกับมือถือ</span>
					</div>
				{:else}
					<div class="student-rows">
						{#each data.students as student (student.id)}
							<article class="student-row">
								<div class="student-main">
									<strong aria-label={`เลขที่ ${student.studentNo}`}>{student.studentNo}</strong>
									<div>
										<span>{student.fullName}</span>
										<code>{student.qrPayload}</code>
									</div>
								</div>
								<Badge variant="success">QR พร้อม</Badge>
							</article>
						{/each}
					</div>
				{/if}
			</section>
		</section>
	{/if}
</main>

<style>
	.students-shell {
		min-height: 100dvh;
		max-width: 1120px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 32px);
		color: var(--qc-text);
	}

	.roster-hero,
	.student-form,
	.import-form,
	.student-list {
		border: 1px solid var(--qc-border);
		background: color-mix(in srgb, var(--qc-surface) 94%, white);
		box-shadow: var(--qc-shadow);
	}

	.roster-hero {
		border-radius: var(--qc-radius-lg);
		padding: clamp(18px, 4vw, 30px);
	}

	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
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

	.class-meta,
	.panel-heading span,
	.list-heading span,
	.empty-state span {
		display: block;
		margin: 8px 0 0;
		color: var(--qc-muted);
		line-height: 1.55;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		white-space: nowrap;
	}

	.roster-layout {
		display: grid;
		grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
		gap: 16px;
		margin-top: 16px;
	}

	.student-form,
	.import-form,
	.student-list {
		border-radius: var(--qc-radius-md);
		padding: 18px;
	}

	.roster-tools {
		display: grid;
		gap: 15px;
		align-content: start;
		position: sticky;
		top: 16px;
	}

	.student-form,
	.import-form {
		display: grid;
		gap: 15px;
	}

	:global(.notice.ui-alert) {
		margin-top: 16px;
	}

	:global(.notice.ui-alert) span,
	:global(.form-error.ui-alert) span {
		display: block;
		margin-top: 8px;
	}

	:global(.form-submit.ui-button) {
		width: 100%;
	}

	.import-example {
		display: grid;
		gap: 4px;
		border: 1px dashed var(--qc-border-strong);
		border-radius: var(--qc-radius-sm);
		background: var(--qc-surface-green);
		padding: 12px;
		color: var(--qc-muted);
		font-size: 0.84rem;
	}

	.import-example strong {
		color: var(--qc-text);
	}

	.import-example code {
		font-family: inherit;
	}

	.import-result {
		display: grid;
		gap: 10px;
		border-top: 1px solid var(--qc-border);
		padding-top: 12px;
	}

	.import-result-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.import-result-rows {
		display: grid;
		gap: 6px;
	}

	.import-result-row {
		display: grid;
		gap: 2px;
		border: 1px solid var(--qc-border);
		border-radius: 12px;
		background: var(--qc-surface);
		padding: 9px 10px;
	}

	.import-result-row[data-status='created'] {
		border-color: color-mix(in srgb, var(--qc-primary) 22%, var(--qc-border));
		background: var(--qc-surface-green);
	}

	.import-result-row span,
	.import-result-row small {
		color: var(--qc-muted);
		font-size: 0.78rem;
	}

	.import-result-row strong {
		font-size: 0.92rem;
		line-height: 1.35;
	}

	.list-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid var(--qc-border);
		padding-bottom: 14px;
	}

	.student-rows {
		display: grid;
		gap: 8px;
		margin-top: 14px;
	}

	.student-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		border: 1px solid transparent;
		border-radius: 14px;
		background: var(--qc-surface-green);
		padding: 12px 12px 12px 10px;
	}

	.student-row:hover {
		border-color: color-mix(in srgb, var(--qc-primary) 22%, var(--qc-border));
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
	.student-main code {
		display: block;
	}

	.student-main span {
		font-weight: 600;
		line-height: 1.25;
	}

	.student-main code {
		max-width: min(56vw, 520px);
		margin-top: 3px;
		overflow: hidden;
		color: var(--qc-muted);
		font-size: 0.78rem;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		.students-shell {
			padding: 12px;
		}

		.hero-grid,
		.roster-layout,
		.list-heading,
		.student-row {
			display: grid;
		}

		.hero-grid,
		.roster-layout {
			grid-template-columns: 1fr;
		}

		.hero-grid {
			gap: 16px;
			align-items: start;
		}

		.hero-actions {
			display: grid;
			justify-content: stretch;
			white-space: normal;
		}

		:global(.hero-actions .ui-link-button) {
			width: 100%;
		}

		.roster-tools {
			position: static;
		}

		.student-main {
			align-items: flex-start;
		}

		.student-main code {
			max-width: 72vw;
		}
	}
</style>
