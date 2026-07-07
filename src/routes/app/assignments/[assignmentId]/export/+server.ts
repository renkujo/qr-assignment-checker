import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAssignment } from '$lib/assignments';
import { getAssignmentSummary } from '$lib/submissions';
import type { IAssignmentSummaryRow } from '$lib/submissions';
import { listStudents } from '$lib/students';

const csvHeader = ['เลขที่', 'ชื่อ-นามสกุล', 'สถานะ', 'เวลาส่ง'];

const escapeCsvCell = (value: string): string => {
	const normalizedValue = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
	const escapedValue = normalizedValue.replaceAll('"', '""');

	return `"${escapedValue}"`;
};

const getThaiStatus = (status: IAssignmentSummaryRow['status']): string => {
	return status === 'submitted' ? 'ส่งแล้ว' : 'ยังไม่ส่ง';
};

const createCsvRow = (row: IAssignmentSummaryRow): string => {
	return [row.studentNo, row.fullName, getThaiStatus(row.status), row.submittedAt]
		.map(escapeCsvCell)
		.join(',');
};

const createCsv = (rows: IAssignmentSummaryRow[]): string => {
	return ['\uFEFF' + csvHeader.map(escapeCsvCell).join(','), ...rows.map(createCsvRow)].join('\n');
};

const createContentDisposition = (
	assignmentId: string,
	title: string,
	classCode: string
): string => {
	const fallbackFilename = `assignment-${assignmentId}.csv`;
	const utf8Filename = encodeURIComponent(`assignment-${title}-${classCode}.csv`);

	return `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${utf8Filename}`;
};

export const GET: RequestHandler = async ({ locals, params }) => {
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
		const csv = createCsv(summary.rows);

		return new Response(csv, {
			status: 200,
			headers: {
				'content-type': 'text/csv; charset=utf-8',
				'content-disposition': createContentDisposition(
					assignment.id,
					assignment.title,
					assignment.classCode
				)
			}
		});
	} catch {
		error(404, 'ไม่พบ assignment หรือคุณไม่มีสิทธิ์เข้าถึง');
	}
};
