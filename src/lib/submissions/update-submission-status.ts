import type PocketBase from 'pocketbase';

export type ManualSubmissionTargetStatus = 'submitted' | 'missing';

export interface IUpdateSubmissionStatusInput {
	pb: PocketBase;
	assignmentId: string;
	studentId: string;
	expectedStatus: ManualSubmissionTargetStatus;
	expectedUpdatedAt: string;
	targetStatus: ManualSubmissionTargetStatus;
}

export interface IUpdateSubmissionStatusResult {
	status: 'updated' | 'unchanged';
	studentId: string;
	studentName: string;
	studentNo: string;
	targetStatus: ManualSubmissionTargetStatus;
	updatedAt: string;
	message: string;
}

interface IPocketBaseErrorLike {
	response?: {
		message?: string;
	};
}

const isPocketBaseErrorLike = (error: unknown): error is IPocketBaseErrorLike => {
	return typeof error === 'object' && error !== null && 'response' in error;
};

const getUpdateErrorMessage = (error: unknown): string => {
	if (isPocketBaseErrorLike(error) && error.response?.message) {
		return error.response.message;
	}

	return 'ปรับสถานะการส่งงานไม่สำเร็จ';
};

export const updateSubmissionStatus = async ({
	pb,
	assignmentId,
	studentId,
	expectedStatus,
	expectedUpdatedAt,
	targetStatus
}: IUpdateSubmissionStatusInput): Promise<IUpdateSubmissionStatusResult> => {
	try {
		return await pb.send<IUpdateSubmissionStatusResult>('/api/manual-submission-status', {
			method: 'POST',
			body: {
				assignmentId,
				studentId,
				expectedStatus,
				expectedUpdatedAt,
				status: targetStatus
			}
		});
	} catch (error) {
		throw new Error(getUpdateErrorMessage(error), { cause: error });
	}
};
