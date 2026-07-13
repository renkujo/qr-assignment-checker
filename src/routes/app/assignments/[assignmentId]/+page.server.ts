import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAssignment, updateAssignmentStatus } from '$lib/assignments';
import type { AssignmentStatus } from '$lib/assignments';
import { getAssignmentSummary, updateSubmissionStatus } from '$lib/submissions';
import type { ManualSubmissionTargetStatus } from '$lib/submissions';
import { listStudents } from '$lib/students';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(303, `/login?redirectTo=/app/assignments/${params.assignmentId}`);
	}

	try {
		const assignment = await getAssignment({
			pb: locals.pb,
			assignmentId: params.assignmentId
		});
		const students = await listStudents({
			pb: locals.pb,
			classId: assignment.classId
		});
		const summary = await getAssignmentSummary({
			pb: locals.pb,
			assignmentId: assignment.id,
			students
		});

		return {
			assignment,
			summary
		};
	} catch {
		error(404, 'ไม่พบ assignment หรือคุณไม่มีสิทธิ์เข้าถึง');
	}
};

const getNextStatus = (
	value: FormDataEntryValue | null
): Extract<AssignmentStatus, 'active' | 'closed'> | null => {
	if (value === 'active' || value === 'closed') {
		return value;
	}

	return null;
};

const getManualSubmissionTargetStatus = (
	value: FormDataEntryValue | null
): ManualSubmissionTargetStatus | null => {
	if (value === 'submitted' || value === 'missing') {
		return value;
	}

	return null;
};

export const actions: Actions = {
	setStatus: async ({ locals, params, request }) => {
		if (!locals.user) {
			redirect(303, `/login?redirectTo=/app/assignments/${params.assignmentId}`);
		}

		const formData = await request.formData();
		const status = getNextStatus(formData.get('status'));

		if (!status) {
			return fail(400, {
				message: 'สถานะ assignment ไม่ถูกต้อง'
			});
		}

		try {
			await updateAssignmentStatus({
				pb: locals.pb,
				assignmentId: params.assignmentId,
				status
			});
		} catch {
			return fail(400, {
				message: 'อัปเดตสถานะ assignment ไม่สำเร็จ'
			});
		}

		redirect(303, `/app/assignments/${params.assignmentId}`);
	},
	setStudentSubmissionStatus: async ({ locals, params, request }) => {
		if (!locals.user) {
			redirect(303, `/login?redirectTo=/app/assignments/${params.assignmentId}`);
		}

		const formData = await request.formData();
		const studentId = String(formData.get('studentId') || '').trim();
		const expectedStatus = getManualSubmissionTargetStatus(formData.get('expectedStatus'));
		const expectedUpdatedAt = String(formData.get('expectedUpdatedAt') || '').trim();
		const targetStatus = getManualSubmissionTargetStatus(formData.get('targetStatus'));

		if (!studentId || !expectedStatus || !targetStatus) {
			return fail(400, {
				formName: 'studentSubmissionStatus',
				message: 'ข้อมูลสถานะนักเรียนไม่ถูกต้อง'
			});
		}

		try {
			const statusResult = await updateSubmissionStatus({
				pb: locals.pb,
				assignmentId: params.assignmentId,
				studentId,
				expectedStatus,
				expectedUpdatedAt,
				targetStatus
			});

			return {
				formName: 'studentSubmissionStatus',
				statusResult,
				message: statusResult.message
			};
		} catch (statusError) {
			return fail(400, {
				formName: 'studentSubmissionStatus',
				message: statusError instanceof Error ? statusError.message : 'ปรับสถานะการส่งงานไม่สำเร็จ'
			});
		}
	}
};
