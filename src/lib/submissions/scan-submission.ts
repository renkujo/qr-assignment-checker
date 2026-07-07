import type PocketBase from 'pocketbase';

export type ScanSubmissionStatus = 'submitted' | 'duplicate' | 'invalid' | 'wrong-class' | 'closed';

export interface IScanSubmissionInput {
	pb: PocketBase;
	assignmentId: string;
	teacherId: string;
	qrPayload: string;
}

export interface IScanSubmissionResult {
	status: ScanSubmissionStatus;
	studentName?: string;
	studentNo?: string;
	submittedAt?: string;
	message: string;
}

interface IPocketBaseScanSubmissionResponse {
	status: 'submitted' | 'duplicate';
	studentName?: string;
	studentNo?: string;
	submittedAt?: string;
	message?: string;
}

interface IPocketBaseErrorLike {
	response?: {
		message?: string;
	};
}

const isPocketBaseErrorLike = (error: unknown): error is IPocketBaseErrorLike => {
	return typeof error === 'object' && error !== null && 'response' in error;
};

const getScanErrorMessage = (error: unknown): string => {
	if (isPocketBaseErrorLike(error) && error.response?.message) {
		if (error.response.message.toLowerCase().includes('closed')) {
			return 'assignment นี้ปิดรับแล้ว';
		}

		return error.response.message;
	}

	return 'บันทึกผลสแกนไม่สำเร็จ';
};

export const scanSubmission = async ({
	pb,
	assignmentId,
	qrPayload
}: IScanSubmissionInput): Promise<IScanSubmissionResult> => {
	try {
		const result = await pb.send<IPocketBaseScanSubmissionResponse>('/api/scan-submissions', {
			method: 'POST',
			body: {
				assignmentId,
				qrPayload
			}
		});

		return {
			status: result.status,
			studentName: result.studentName,
			studentNo: result.studentNo,
			submittedAt: result.submittedAt,
			message: result.message || 'บันทึกผลสแกนแล้ว'
		};
	} catch (error) {
		return {
			status: 'invalid',
			message: getScanErrorMessage(error)
		};
	}
};
