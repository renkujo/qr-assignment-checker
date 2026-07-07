import type PocketBase from 'pocketbase';
import type { IStudentListItem } from '$lib/students';

export interface ISubmissionRecord {
	id: string;
	assignment: string;
	student: string;
	class_code: string;
	submitted_by: string;
	submitted_at: string;
	scan_source: 'camera' | 'manual';
	submission_key: string;
}

export interface IAssignmentSummaryRow {
	studentId: string;
	studentNo: string;
	fullName: string;
	status: 'submitted' | 'missing';
	submittedAt: string;
}

export interface IGetAssignmentSummaryInput {
	pb: PocketBase;
	assignmentId: string;
	students: IStudentListItem[];
}

export interface IAssignmentSummary {
	rows: IAssignmentSummaryRow[];
	submittedCount: number;
	missingCount: number;
}

export const getAssignmentSummary = async ({
	pb,
	assignmentId,
	students
}: IGetAssignmentSummaryInput): Promise<IAssignmentSummary> => {
	const submissions = await pb.collection('submissions').getFullList<ISubmissionRecord>({
		filter: pb.filter('assignment = {:assignmentId}', { assignmentId })
	});
	const submissionByStudentId = new Map(
		submissions.map((submission) => [submission.student, submission])
	);
	const rows = students.map<IAssignmentSummaryRow>((student) => {
		const submission = submissionByStudentId.get(student.id);

		return {
			studentId: student.id,
			studentNo: student.studentNo,
			fullName: student.fullName,
			status: submission ? 'submitted' : 'missing',
			submittedAt: submission?.submitted_at || ''
		};
	});

	const submittedCount = rows.filter((row) => row.status === 'submitted').length;

	return {
		rows,
		submittedCount,
		missingCount: rows.length - submittedCount
	};
};
