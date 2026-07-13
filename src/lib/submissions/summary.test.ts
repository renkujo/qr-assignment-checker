import { describe, expect, it } from 'vitest';
import type PocketBase from 'pocketbase';
import type { IStudentListItem } from '$lib/students';
import { getAssignmentSummary } from './summary';

const students: IStudentListItem[] = [
	{
		id: 'student-1',
		studentNo: '1',
		fullName: 'เด็กชายหนึ่ง',
		qrToken: 'token-1',
		qrPayload: 'student:token-1',
		active: true
	},
	{
		id: 'student-2',
		studentNo: '2',
		fullName: 'เด็กหญิงสอง',
		qrToken: 'token-2',
		qrPayload: 'student:token-2',
		active: true
	},
	{
		id: 'student-3',
		studentNo: '3',
		fullName: 'เด็กชายสาม',
		qrToken: 'token-3',
		qrPayload: 'student:token-3',
		active: true
	}
];

const createPocketBaseMock = (): PocketBase => {
	const recordsByCollection = {
		submissions: [
			{
				id: 'submission-1',
				assignment: 'assignment-1',
				student: 'student-1',
				class_code: 'CLASS-1',
				submitted_by: 'teacher-1',
				submitted_at: '2026-07-13 10:00:00.000Z',
				scan_source: 'camera',
				submission_key: 'assignment-1:student-1',
				status: 'submitted',
				status_source: 'camera',
				status_updated_by: 'teacher-1',
				status_updated_at: '2026-07-13 10:00:00.000Z'
			},
			{
				id: 'submission-2',
				assignment: 'assignment-1',
				student: 'student-2',
				class_code: 'CLASS-1',
				submitted_by: 'teacher-1',
				submitted_at: '2026-07-13 10:02:00.000Z',
				scan_source: 'camera',
				submission_key: 'assignment-1:student-2',
				status: 'revoked',
				status_source: 'manual',
				status_updated_by: 'teacher-1',
				status_updated_at: '2026-07-13 10:05:00.000Z'
			}
		]
	};

	return {
		filter: (filter: string) => filter,
		collection: (collectionName: keyof typeof recordsByCollection) => ({
			getFullList: async () => recordsByCollection[collectionName]
		})
	} as unknown as PocketBase;
};

describe('getAssignmentSummary', () => {
	it('treats revoked submissions as missing and keeps latest audit metadata', async () => {
		const summary = await getAssignmentSummary({
			pb: createPocketBaseMock(),
			assignmentId: 'assignment-1',
			students
		});

		expect(summary.submittedCount).toBe(1);
		expect(summary.missingCount).toBe(2);
		expect(summary.rows).toEqual([
			{
				studentId: 'student-1',
				studentNo: '1',
				fullName: 'เด็กชายหนึ่ง',
				status: 'submitted',
				submittedAt: '2026-07-13 10:00:00.000Z',
				statusSource: 'camera',
				statusUpdatedAt: '2026-07-13 10:00:00.000Z'
			},
			{
				studentId: 'student-2',
				studentNo: '2',
				fullName: 'เด็กหญิงสอง',
				status: 'missing',
				submittedAt: '',
				statusSource: 'manual',
				statusUpdatedAt: '2026-07-13 10:05:00.000Z'
			},
			{
				studentId: 'student-3',
				studentNo: '3',
				fullName: 'เด็กชายสาม',
				status: 'missing',
				submittedAt: '',
				statusSource: '',
				statusUpdatedAt: ''
			}
		]);
	});
});
