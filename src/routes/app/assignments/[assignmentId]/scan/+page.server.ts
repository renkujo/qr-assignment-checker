import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAssignment } from '$lib/assignments';
import { getAssignmentSummary } from '$lib/submissions';
import { listStudents } from '$lib/students';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(303, `/login?redirectTo=/app/assignments/${params.assignmentId}/scan`);
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
