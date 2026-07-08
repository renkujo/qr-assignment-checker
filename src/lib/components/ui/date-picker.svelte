<script lang="ts">
	import Icon from '@iconify/svelte/dist/OfflineIcon.svelte';
	import calendarDaysIconModule from '@iconify/icons-lucide/calendar-days.js';
	import chevronDownIconModule from '@iconify/icons-lucide/chevron-down.js';

	interface IDatePickerProps {
		name: string;
		value?: string;
		placeholder?: string;
		class?: string;
	}

	interface ICalendarDay {
		date: Date;
		value: string;
		label: string;
		isCurrentMonth: boolean;
		isSelected: boolean;
		isToday: boolean;
	}

	const dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
	type IIconifyIconData = typeof calendarDaysIconModule;
	const resolveIconData = (
		iconModule: IIconifyIconData | { default: IIconifyIconData }
	): IIconifyIconData => {
		return 'default' in iconModule ? iconModule.default : iconModule;
	};
	const calendarDaysIcon = resolveIconData(calendarDaysIconModule);
	const chevronDownIcon = resolveIconData(chevronDownIconModule);

	let {
		name,
		value = '',
		placeholder = 'เลือกวัน',
		class: className = ''
	}: IDatePickerProps = $props();

	let selectedValue = $state('');
	let visibleYear = $state(new Date().getFullYear());
	let visibleMonth = $state(new Date().getMonth());
	let open = $state(false);

	$effect(() => {
		selectedValue = value;
		const visibleDate = value ? new Date(`${value}T12:00:00`) : new Date();
		visibleYear = visibleDate.getFullYear();
		visibleMonth = visibleDate.getMonth();
	});

	const padDatePart = (datePart: number): string => {
		return String(datePart).padStart(2, '0');
	};

	const toDateValue = (date: Date): string => {
		return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
	};

	const getMonthLabel = (year: number, month: number): string => {
		return new Intl.DateTimeFormat('th-TH', {
			month: 'long',
			year: 'numeric'
		}).format(new Date(year, month, 1, 12));
	};

	const getDisplayDate = (dateValue: string): string => {
		if (!dateValue) return placeholder;

		return new Intl.DateTimeFormat('th-TH', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(`${dateValue}T12:00:00`));
	};

	const createCalendarDays = (
		year: number,
		month: number,
		selectedDateValue: string
	): ICalendarDay[] => {
		const firstDayOfMonth = new Date(year, month, 1, 12);
		const firstGridDayDate = firstDayOfMonth.getDate() - firstDayOfMonth.getDay();

		const todayValue = toDateValue(new Date());

		return Array.from({ length: 42 }, (_, index) => {
			const date = new Date(year, month, firstGridDayDate + index, 12);
			const dateValue = toDateValue(date);

			return {
				date,
				value: dateValue,
				label: String(date.getDate()),
				isCurrentMonth: date.getMonth() === month,
				isSelected: dateValue === selectedDateValue,
				isToday: dateValue === todayValue
			};
		});
	};

	const monthLabel = $derived(getMonthLabel(visibleYear, visibleMonth));
	const displayDate = $derived(getDisplayDate(selectedValue));
	const calendarDays = $derived(createCalendarDays(visibleYear, visibleMonth, selectedValue));

	const moveMonth = (direction: -1 | 1): void => {
		const nextMonth = new Date(visibleYear, visibleMonth + direction, 1, 12);
		visibleYear = nextMonth.getFullYear();
		visibleMonth = nextMonth.getMonth();
	};

	const selectDate = (dateValue: string): void => {
		selectedValue = dateValue;
		open = false;
	};

	const clearDate = (): void => {
		selectedValue = '';
		open = false;
	};
</script>

<div class={['ui-date-picker', className].filter(Boolean).join(' ')}>
	<input type="hidden" {name} value={selectedValue} />

	<button
		type="button"
		class:has-value={Boolean(selectedValue)}
		class="ui-date-picker__trigger"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<span class="ui-date-picker__trigger-content">
			<Icon
				class="ui-date-picker__icon"
				icon={calendarDaysIcon}
				width="18"
				height="18"
				aria-hidden="true"
			/>
			<span>{displayDate}</span>
		</span>
		<Icon
			class="ui-date-picker__icon"
			icon={chevronDownIcon}
			width="18"
			height="18"
			aria-hidden="true"
		/>
	</button>

	{#if open}
		<div class="ui-date-picker__popover" role="dialog" aria-label="เลือกวันกำหนดส่ง">
			<div class="ui-date-picker__header">
				<button
					type="button"
					class="ui-date-picker__nav"
					aria-label="เดือนก่อนหน้า"
					onclick={() => moveMonth(-1)}
				>
					←
				</button>
				<strong>{monthLabel}</strong>
				<button
					type="button"
					class="ui-date-picker__nav"
					aria-label="เดือนถัดไป"
					onclick={() => moveMonth(1)}
				>
					→
				</button>
			</div>

			<div class="ui-date-picker__weekdays" aria-hidden="true">
				{#each dayLabels as dayLabel (dayLabel)}
					<span>{dayLabel}</span>
				{/each}
			</div>

			<div class="ui-date-picker__grid">
				{#each calendarDays as day (day.value)}
					<button
						type="button"
						class="ui-date-picker__day"
						class:is-muted={!day.isCurrentMonth}
						class:is-selected={day.isSelected}
						class:is-today={day.isToday}
						onclick={() => selectDate(day.value)}
					>
						{day.label}
					</button>
				{/each}
			</div>

			<div class="ui-date-picker__footer">
				<button type="button" onclick={clearDate}>ไม่กำหนดวันส่ง</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.ui-date-picker {
		position: relative;
	}

	.ui-date-picker__trigger {
		display: flex;
		min-height: 44px;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border: 1px solid var(--qc-border-strong);
		border-radius: var(--qc-radius-md);
		background: var(--qc-surface);
		padding: 0 12px;
		color: var(--qc-muted);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.ui-date-picker__trigger.has-value {
		color: var(--qc-text);
	}

	.ui-date-picker__trigger-content {
		display: inline-flex;
		min-width: 0;
		align-items: center;
		gap: 10px;
	}

	.ui-date-picker__trigger-content span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.ui-date-picker__icon) {
		flex: 0 0 auto;
	}

	.ui-date-picker__trigger:hover,
	.ui-date-picker__trigger:focus-visible {
		border-color: var(--qc-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--qc-primary) 14%, transparent);
		outline: 0;
	}

	.ui-date-picker__popover {
		position: absolute;
		z-index: 20;
		top: calc(100% + 8px);
		left: 0;
		width: min(100%, 320px);
		border: 1px solid var(--qc-border);
		border-radius: var(--qc-radius-lg);
		background: var(--qc-surface);
		padding: 12px;
	}

	.ui-date-picker__header,
	.ui-date-picker__weekdays,
	.ui-date-picker__grid,
	.ui-date-picker__footer {
		display: grid;
	}

	.ui-date-picker__header {
		grid-template-columns: 36px minmax(0, 1fr) 36px;
		align-items: center;
		gap: 8px;
	}

	.ui-date-picker__header strong {
		text-align: center;
		font-weight: 500;
	}

	.ui-date-picker__nav,
	.ui-date-picker__day,
	.ui-date-picker__footer button {
		border: 1px solid transparent;
		border-radius: var(--qc-radius-sm);
		background: transparent;
		color: var(--qc-text);
		font: inherit;
		cursor: pointer;
	}

	.ui-date-picker__nav {
		min-height: 34px;
	}

	.ui-date-picker__weekdays,
	.ui-date-picker__grid {
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 4px;
	}

	.ui-date-picker__weekdays {
		margin-top: 12px;
		color: var(--qc-muted);
		font-size: 0.76rem;
		text-align: center;
	}

	.ui-date-picker__grid {
		margin-top: 6px;
	}

	.ui-date-picker__day {
		aspect-ratio: 1;
		min-width: 0;
		font-size: 0.9rem;
	}

	.ui-date-picker__nav:hover,
	.ui-date-picker__day:hover,
	.ui-date-picker__footer button:hover {
		border-color: var(--qc-border-strong);
		background: var(--qc-primary-soft);
	}

	.ui-date-picker__day.is-muted {
		color: var(--qc-subtle);
	}

	.ui-date-picker__day.is-today {
		border-color: var(--qc-border-strong);
	}

	.ui-date-picker__day.is-selected {
		border-color: var(--qc-primary);
		background: var(--qc-primary);
		color: #ffffff;
	}

	.ui-date-picker__footer {
		margin-top: 10px;
		border-top: 1px solid var(--qc-border);
		padding-top: 10px;
	}

	.ui-date-picker__footer button {
		min-height: 36px;
		color: var(--qc-muted);
	}

	@media (max-width: 520px) {
		.ui-date-picker__popover {
			width: 100%;
		}
	}
</style>
