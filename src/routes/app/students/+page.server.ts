import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ensureDefaultClass } from '$lib/classes';
import { createStudent, listStudents } from '$lib/students';

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
	}
};
