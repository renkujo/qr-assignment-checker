<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert, Badge, Button, Input, Label } from '$lib/components/ui';

	let { data, form } = $props();

	const studentCount = $derived(data.students.length);
</script>

<svelte:head>
	<title>รายชื่อนักเรียน | QR Assignment Checker</title>
</svelte:head>

<main class="students-shell">
	<header class="roster-hero">
		<a class="back-link" href={resolve('/app')}>← กลับ workspace</a>
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
				<a class="secondary-action" href={resolve('/app/assignments')}>ดูงานที่ต้องตรวจ</a>
				<a class="primary-action" href={resolve('/app/students/print')}>พิมพ์ QR ทั้งห้อง</a>
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

				{#if form?.message}
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
	.student-list {
		border: 1px solid var(--qc-border);
		background: color-mix(in srgb, var(--qc-surface) 94%, white);
		box-shadow: var(--qc-shadow);
	}

	.roster-hero {
		border-radius: var(--qc-radius-lg);
		padding: clamp(18px, 4vw, 30px);
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
		font-weight: 700;
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

	.primary-action,
	.secondary-action {
		display: inline-flex;
		min-height: 46px;
		align-items: center;
		justify-content: center;
		border-radius: var(--qc-radius-sm);
		padding: 0 16px;
		font-weight: 750;
		text-decoration: none;
	}

	.primary-action {
		border: 1px solid var(--qc-primary);
		background: var(--qc-primary);
		color: #ffffff;
	}

	.primary-action:hover {
		background: var(--qc-primary-strong);
	}

	.secondary-action {
		border: 1px solid var(--qc-border-strong);
		background: var(--qc-surface);
		color: var(--qc-primary);
	}

	.secondary-action:hover {
		border-color: var(--qc-primary);
		background: var(--qc-primary-soft);
	}

	.roster-layout {
		display: grid;
		grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
		gap: 16px;
		margin-top: 16px;
	}

	.student-form,
	.student-list {
		border-radius: var(--qc-radius-md);
		padding: 18px;
	}

	.student-form {
		display: grid;
		align-content: start;
		gap: 15px;
		position: sticky;
		top: 16px;
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
		font-weight: 750;
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

		.primary-action,
		.secondary-action {
			width: 100%;
		}

		.student-form {
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
