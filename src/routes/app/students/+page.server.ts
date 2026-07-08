import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ensureDefaultClass } from '$lib/classes';
import { createStudent, listStudents, parseStudentImportText } from '$lib/students';

interface IImportRowResult {
	rowNumber: number;
	studentNo: string;
	fullName: string;
	status: 'created' | 'skipped';
	reason?: string;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/app/students');
	}

	try {
		const classRecord = await ensureDefaultClass({
			pb: locals.pb,
			teacherId: locals.user.id
		});
		const students = await listStudents({
			pb: locals.pb,
			classId: classRecord.id
		});

		return {
			classRecord,
			students,
			unavailable: false
		};
	} catch {
		return {
			classRecord: null,
			students: [],
			unavailable: true
		};
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login?redirectTo=/app/students');
		}

		const formData = await request.formData();
		const studentNo = String(formData.get('studentNo') || '').trim();
		const fullName = String(formData.get('fullName') || '').trim();

		if (!studentNo || !fullName) {
			return fail(400, {
				studentNo,
				fullName,
				message: 'กรอกเลขที่และชื่อ-นามสกุลนักเรียนก่อนบันทึก'
			});
		}

		try {
			const classRecord = await ensureDefaultClass({
				pb: locals.pb,
				teacherId: locals.user.id
			});

			await createStudent({
				pb: locals.pb,
				classRecord,
				studentNo,
				fullName
			});
		} catch {
			return fail(400, {
				studentNo,
				fullName,
				message: 'บันทึกนักเรียนไม่สำเร็จ ตรวจว่า PocketBase เปิดอยู่ หรือเลขที่ซ้ำในห้องนี้'
			});
		}

		redirect(303, '/app/students');
	},
	import: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login?redirectTo=/app/students');
		}

		const formData = await request.formData();
		const importText = String(formData.get('importText') || '').trim();

		if (!importText) {
			return fail(400, {
				formName: 'import',
				importText,
				message: 'วางรายชื่อนักเรียนก่อนนำเข้า'
			});
		}

		const parsedImport = parseStudentImportText(importText);

		if (parsedImport.rows.length === 0) {
			return fail(400, {
				formName: 'import',
				importText,
				message: 'ยังไม่มีแถวที่นำเข้าได้ ตรวจรูปแบบเลขที่และชื่อ-นามสกุล',
				importResult: {
					createdCount: 0,
					skippedCount: parsedImport.skippedRows.length,
					rows: parsedImport.skippedRows.map((row) => ({ ...row, status: 'skipped' }))
				}
			});
		}

		try {
			const classRecord = await ensureDefaultClass({
				pb: locals.pb,
				teacherId: locals.user.id
			});
			const existingStudents = await listStudents({
				pb: locals.pb,
				classId: classRecord.id
			});
			const existingStudentNumbers = new Set(
				existingStudents.map((student) => student.studentNo.trim())
			);
			const rowResults: IImportRowResult[] = parsedImport.skippedRows.map((row) => ({
				...row,
				status: 'skipped'
			}));

			for (const row of parsedImport.rows) {
				if (existingStudentNumbers.has(row.studentNo)) {
					rowResults.push({
						...row,
						status: 'skipped',
						reason: 'เลขที่นี้มีอยู่ในห้องแล้ว'
					});
					continue;
				}

				try {
					await createStudent({
						pb: locals.pb,
						classRecord,
						studentNo: row.studentNo,
						fullName: row.fullName
					});
					existingStudentNumbers.add(row.studentNo);
					rowResults.push({ ...row, status: 'created' });
				} catch {
					rowResults.push({
						...row,
						status: 'skipped',
						reason: 'บันทึกแถวนี้ไม่สำเร็จ'
					});
				}
			}

			const createdCount = rowResults.filter((row) => row.status === 'created').length;
			const skippedCount = rowResults.length - createdCount;

			return {
				formName: 'import',
				importText: '',
				message:
					createdCount > 0
						? `นำเข้าสำเร็จ ${createdCount} คน${skippedCount ? ` · ข้าม ${skippedCount} แถว` : ''}`
						: 'ยังไม่มีรายชื่อใหม่ที่นำเข้าได้',
				importResult: {
					createdCount,
					skippedCount,
					rows: rowResults.sort((firstRow, secondRow) => firstRow.rowNumber - secondRow.rowNumber)
				}
			};
		} catch {
			return fail(400, {
				formName: 'import',
				importText,
				message: 'นำเข้ารายชื่อไม่สำเร็จ ตรวจว่า PocketBase เปิดอยู่แล้วลองใหม่'
			});
		}
	}
};
