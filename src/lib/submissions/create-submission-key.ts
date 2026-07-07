export interface ICreateSubmissionKeyInput {
	assignmentId: string;
	studentId: string;
}

export const createSubmissionKey = ({
	assignmentId,
	studentId
}: ICreateSubmissionKeyInput): string => {
	const normalizedAssignmentId = assignmentId.trim();
	const normalizedStudentId = studentId.trim();

	if (!normalizedAssignmentId || !normalizedStudentId) {
		throw new Error('Assignment ID and student ID are required');
	}

	return `${normalizedAssignmentId}:${normalizedStudentId}`;
};
