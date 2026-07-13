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
	status: 'submitted' | 'revoked';
	status_source: 'camera' | 'manual';
	status_updated_by: string;
	status_updated_at: string;
}

export interface ISubmissionStatusEventRecord {
	id: string;
	assignment: string;
	student: string;
	from_status: '' | 'submitted' | 'revoked';
	to_status: 'submitted' | 'revoked';
	source: 'camera' | 'manual';
	teacher: string;
	changed_at: string;
}

export interface IAssignmentSummaryRow {
	studentId: string;
	studentNo: string;
	fullName: string;
	status: 'submitted' | 'missing';
	submittedAt: string;
	statusSource: '' | 'camera' | 'manual';
	statusUpdatedAt: string;
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
		const isSubmitted = submission?.status === 'submitted';

		return {
			studentId: student.id,
			studentNo: student.studentNo,
			fullName: student.fullName,
			status: isSubmitted ? 'submitted' : 'missing',
			submittedAt: isSubmitted ? submission.submitted_at : '',
			statusSource: submission?.status_source || '',
			statusUpdatedAt: submission?.status_updated_at || ''
		};
	});

	const submittedCount = rows.filter((row) => row.status === 'submitted').length;

	return {
		rows,
		submittedCount,
		missingCount: rows.length - submittedCount
	};
};
