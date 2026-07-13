export { createSubmissionKey } from './create-submission-key';
export type { ICreateSubmissionKeyInput } from './create-submission-key';
export { scanSubmission } from './scan-submission';
export type {
	IScanSubmissionInput,
	IScanSubmissionResult,
	ScanSubmissionStatus
} from './scan-submission';
export { getAssignmentSummary } from './summary';
export type {
	IAssignmentSummary,
	IAssignmentSummaryRow,
	IGetAssignmentSummaryInput,
	ISubmissionRecord,
	ISubmissionStatusEventRecord
} from './summary';
export { updateSubmissionStatus } from './update-submission-status';
export type {
	IUpdateSubmissionStatusInput,
	IUpdateSubmissionStatusResult,
	ManualSubmissionTargetStatus
} from './update-submission-status';
