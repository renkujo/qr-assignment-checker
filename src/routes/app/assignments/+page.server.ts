import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createAssignment, listAssignments } from '$lib/assignments';
import { ensureDefaultClass } from '$lib/classes';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/app/assignments');
	}

	try {
		const classRecord = await ensureDefaultClass({
			pb: locals.pb,
			teacherId: locals.user.id
		});
		const assignments = await listAssignments({
			pb: locals.pb,
			classId: classRecord.id
		});

		return {
			classRecord,
			assignments,
			unavailable: false
		};
	} catch {
		return {
			classRecord: null,
			assignments: [],
			unavailable: true
		};
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login?redirectTo=/app/assignments');
		}

		const formData = await request.formData();
		const title = String(formData.get('title') || '').trim();
		const dueDate = String(formData.get('dueDate') || '').trim();

		if (!title) {
			return fail(400, {
				title,
				dueDate,
				message: 'กรอกชื่อ assignment ก่อนบันทึก'
			});
		}

		try {
			const classRecord = await ensureDefaultClass({
				pb: locals.pb,
				teacherId: locals.user.id
			});
			await createAssignment({
				pb: locals.pb,
				classRecord,
				teacherId: locals.user.id,
				title,
				dueDate
			});
		} catch {
			return fail(400, {
				title,
				dueDate,
				message: 'สร้าง assignment ไม่สำเร็จ ตรวจว่า PocketBase เปิดอยู่'
			});
		}

		redirect(303, '/app/assignments');
	}
};
