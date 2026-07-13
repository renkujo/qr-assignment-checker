import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createAssignment,
	listAssignments,
	listDeletedAssignments,
	updateAssignmentDeletionStatus
} from '$lib/assignments';
import { ensureDefaultClass } from '$lib/classes';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/app/assignments');
	}

	try {
		const isTrashView = url.searchParams.get('view') === 'trash';
		const classRecord = await ensureDefaultClass({
			pb: locals.pb,
			teacherId: locals.user.id
		});
		const activeAssignments = await listAssignments({
			pb: locals.pb,
			classId: classRecord.id
		});
		const deletedAssignments = await listDeletedAssignments({
			pb: locals.pb,
			classId: classRecord.id
		});

		return {
			classRecord,
			assignments: isTrashView ? deletedAssignments : activeAssignments,
			activeAssignmentCount: activeAssignments.length,
			deletedAssignmentCount: deletedAssignments.length,
			isTrashView,
			notice:
				url.searchParams.get('deleted') === '1'
					? 'ย้ายใบงานไปถังขยะแล้ว'
					: url.searchParams.get('restored') === '1'
						? 'กู้คืนใบงานแล้ว ใบงานยังคงปิดรับอยู่'
						: '',
			unavailable: false
		};
	} catch {
		return {
			classRecord: null,
			assignments: [],
			activeAssignmentCount: 0,
			deletedAssignmentCount: 0,
			isTrashView: false,
			notice: '',
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
				formName: 'createAssignment',
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
				formName: 'createAssignment',
				title,
				dueDate,
				message: 'สร้าง assignment ไม่สำเร็จ ตรวจว่า PocketBase เปิดอยู่'
			});
		}

		redirect(303, '/app/assignments');
	},
	restore: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login?redirectTo=/app/assignments?view=trash');
		}

		const formData = await request.formData();
		const assignmentId = String(formData.get('assignmentId') || '').trim();

		if (!/^[a-z0-9]{15}$/.test(assignmentId)) {
			return fail(400, {
				formName: 'restoreAssignment',
				message: 'ข้อมูลใบงานไม่ถูกต้อง'
			});
		}

		try {
			await updateAssignmentDeletionStatus({
				pb: locals.pb,
				assignmentId,
				action: 'restore'
			});
		} catch {
			return fail(400, {
				formName: 'restoreAssignment',
				message: 'กู้คืนใบงานไม่สำเร็จ'
			});
		}

		redirect(303, '/app/assignments?view=trash&restored=1');
	}
};
