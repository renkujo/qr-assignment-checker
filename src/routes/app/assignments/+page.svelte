<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert, Badge, Button, Input, Label, LinkButton } from '$lib/components/ui';

	let { data, form } = $props();

	const getStatusLabel = (status: string): string => {
		if (status === 'closed') return 'ปิดรับแล้ว';
		if (status === 'draft') return 'ร่าง';
		return 'เปิดรับอยู่';
	};

	const getStatusVariant = (status: string): 'success' | 'danger' | 'muted' => {
		if (status === 'closed') return 'danger';
		if (status === 'draft') return 'muted';
		return 'success';
	};
</script>

<svelte:head>
	<title>งานที่ต้องตรวจ | QR Assignment Checker</title>
</svelte:head>

<main class="assignments-shell">
	<header class="work-hero">
		<LinkButton variant="ghost" href={resolve('/app')}>← กลับ workspace</LinkButton>
		<div class="hero-grid">
			<div>
				<p class="section-kicker">งานในห้องเรียน</p>
				<h1>งานที่ต้องตรวจ</h1>
				{#if data.classRecord}
					<p class="class-meta">
						{data.classRecord.name} · {data.classRecord.subject} · {data.classRecord.class_code}
					</p>
				{:else}
					<p class="class-meta">ยังโหลดข้อมูลห้องไม่ได้</p>
				{/if}
			</div>

			<LinkButton variant="secondary" href={resolve('/app/students')}
				>จัดการรายชื่อนักเรียน</LinkButton
			>
		</div>
	</header>

	{#if data.unavailable}
		<Alert variant="warning" class="notice">
			<strong>PocketBase ยังไม่พร้อม</strong>
			<span>รัน `pnpm pb:serve` แล้วกลับมา refresh หน้านี้อีกครั้ง</span>
		</Alert>
	{:else}
		<section class="work-layout">
			<form method="POST" action="?/create" class="assignment-form" aria-labelledby="add-title">
				<div class="panel-heading">
					<p class="section-kicker">สร้างงาน</p>
					<h2 id="add-title">งานใหม่</h2>
					<span>สร้างงานแล้วเปิดให้สแกนได้ทันที</span>
				</div>

				{#if form?.message}
					<Alert variant="danger" class="form-error">{form.message}</Alert>
				{/if}

				<Label>
					<span>ชื่องาน</span>
					<Input name="title" value={form?.title || ''} placeholder="เช่น ใบงานบทที่ 1" required />
				</Label>

				<Label>
					<span>วันกำหนดส่ง</span>
					<Input name="dueDate" type="date" value={form?.dueDate || ''} />
				</Label>

				<Button type="submit" class="form-submit">สร้างงาน</Button>
			</form>

			<section class="assignment-list" aria-labelledby="assignment-list-title">
				<div class="list-heading">
					<div>
						<p class="section-kicker">รายการตรวจงาน</p>
						<h2 id="assignment-list-title">ทั้งหมด {data.assignments.length} งาน</h2>
					</div>
					<span>เลือกงานเพื่อดูสรุป สแกน หรือดาวน์โหลด CSV</span>
				</div>

				{#if data.assignments.length === 0}
					<div class="empty-state">
						<strong>ยังไม่มีงานที่ต้องตรวจ</strong>
						<span>สร้างงานแรกก่อน แล้วระบบจะเตรียมหน้าสรุปและปุ่มสแกนให้</span>
					</div>
				{:else}
					<div class="assignment-rows">
						{#each data.assignments as assignment (assignment.id)}
							<a
								class:row-closed={assignment.status === 'closed'}
								class="assignment-row"
								href={resolve('/app/assignments/[assignmentId]', { assignmentId: assignment.id })}
							>
								<div class="assignment-main">
									<strong>{assignment.title}</strong>
									<span>
										{assignment.subject}{assignment.dueDate ? ` · ส่ง ${assignment.dueDate}` : ''}
									</span>
								</div>
								<div class="assignment-action">
									<Badge variant={getStatusVariant(assignment.status)}>
										{getStatusLabel(assignment.status)}
									</Badge>
									<em>{assignment.status === 'closed' ? 'ดูสรุป' : 'ตรวจงาน'}</em>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</section>
		</section>
	{/if}
</main>

<style>
	.assignments-shell {
		min-height: 100dvh;
		max-width: 1120px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 32px);
		color: var(--qc-text);
	}

	.work-hero,
	.assignment-form,
	.assignment-list {
		border: 1px solid var(--qc-border);
		background: color-mix(in srgb, var(--qc-surface) 94%, white);
		box-shadow: var(--qc-shadow);
	}

	.work-hero {
		border-radius: var(--qc-radius-lg);
		padding: clamp(18px, 4vw, 30px);
	}

	.assignment-row {
		text-decoration: none;
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

	.work-layout {
		display: grid;
		grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
		gap: 16px;
		margin-top: 16px;
	}

	.assignment-form,
	.assignment-list {
		border-radius: var(--qc-radius-md);
		padding: 18px;
	}

	.assignment-form {
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

	.assignment-rows {
		display: grid;
		gap: 8px;
		margin-top: 14px;
	}

	.assignment-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 14px;
		align-items: center;
		border: 1px solid transparent;
		border-radius: 14px;
		background: var(--qc-surface-green);
		padding: 14px;
		color: inherit;
	}

	.assignment-row:hover {
		border-color: color-mix(in srgb, var(--qc-primary) 22%, var(--qc-border));
	}

	.assignment-row.row-closed {
		background: color-mix(in srgb, var(--qc-surface) 82%, var(--qc-bg-soft));
	}

	.assignment-main strong,
	.assignment-main span,
	.assignment-action em {
		display: block;
	}

	.assignment-main strong {
		font-size: 1.02rem;
		line-height: 1.3;
	}

	.assignment-main span {
		margin-top: 4px;
		color: var(--qc-muted);
		line-height: 1.45;
	}

	.assignment-action {
		display: grid;
		justify-items: end;
		gap: 6px;
	}

	.assignment-action em {
		color: var(--qc-primary);
		font-size: 0.82rem;
		font-style: normal;
		font-weight: 600;
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
		.assignments-shell {
			padding: 12px;
		}

		.hero-grid,
		.work-layout,
		.list-heading,
		.assignment-row {
			display: grid;
			grid-template-columns: 1fr;
		}

		:global(.hero-grid .ui-link-button) {
			width: 100%;
		}

		.assignment-form {
			position: static;
		}

		.assignment-action {
			justify-items: start;
		}
	}
</style>
