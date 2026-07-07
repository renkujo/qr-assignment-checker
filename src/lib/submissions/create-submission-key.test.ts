import { describe, expect, it } from 'vitest';
import { createSubmissionKey } from './create-submission-key';

describe('createSubmissionKey', () => {
	it('uses assignment and student as the submission identity', () => {
		expect(createSubmissionKey({ assignmentId: 'assignment-1', studentId: 'student-7' })).toBe(
			'assignment-1:student-7'
		);
	});

	it('rejects missing IDs', () => {
		expect(() => createSubmissionKey({ assignmentId: '', studentId: 'student-7' })).toThrow(
			'Assignment ID and student ID are required'
		);
	});
});
