import { describe, expect, it, vi } from 'vitest';
import type PocketBase from 'pocketbase';
import {
	getAssignment,
	listAssignments,
	listDeletedAssignments,
	updateAssignmentDeletionStatus
} from './repository';

const activeAssignment = {
	id: 'assignment-001',
	class: 'class-001',
	class_code: 'CLASS-001',
	subject: 'คณิตศาสตร์',
	title: 'ใบงานที่ยังใช้งาน',
	due_date: '',
	status: 'active' as const,
	created_by: 'teacher-001',
	deleted_at: '',
	deleted_by: ''
};

const deletedAssignment = {
	...activeAssignment,
	id: 'assignment-002',
	title: 'ใบงานในถังขยะ',
	status: 'closed' as const,
	deleted_at: '2026-07-13 12:00:00.000Z',
	deleted_by: 'teacher-001'
};

const createPocketBaseMock = () => {
	const getFullList = vi
		.fn()
		.mockResolvedValueOnce([activeAssignment])
		.mockResolvedValueOnce([deletedAssignment]);
	const getOne = vi.fn().mockResolvedValue(deletedAssignment);
	const send = vi.fn().mockResolvedValue({
		status: 'updated',
		action: 'restore',
		assignmentId: deletedAssignment.id,
		deletedAt: '',
		message: 'กู้คืนใบงานแล้ว ใบงานยังคงปิดรับอยู่'
	});
	const pb = {
		filter: (filter: string) => filter,
		collection: () => ({
			getFullList,
			getOne
		}),
		send
	} as unknown as PocketBase;

	return { pb, getFullList, send };
};

describe('assignment repository soft delete', () => {
	it('separates active assignments from deleted assignments', async () => {
		const { pb, getFullList } = createPocketBaseMock();

		const active = await listAssignments({ pb, classId: 'class-001' });
		const deleted = await listDeletedAssignments({ pb, classId: 'class-001' });

		expect(active[0]).toMatchObject({ id: activeAssignment.id, isDeleted: false });
		expect(deleted[0]).toMatchObject({
			id: deletedAssignment.id,
			isDeleted: true,
			deletedAt: deletedAssignment.deleted_at
		});
		expect(getFullList.mock.calls[0][0].filter).toContain('deleted_at = ""');
		expect(getFullList.mock.calls[1][0].filter).toContain('deleted_at != ""');
	});

	it('blocks deleted assignments from normal detail loading', async () => {
		const { pb } = createPocketBaseMock();

		await expect(
			getAssignment({
				pb,
				assignmentId: deletedAssignment.id
			})
		).rejects.toThrow('Assignment is deleted');
	});

	it('sends restore through the server-owned lifecycle endpoint', async () => {
		const { pb, send } = createPocketBaseMock();

		const result = await updateAssignmentDeletionStatus({
			pb,
			assignmentId: deletedAssignment.id,
			action: 'restore'
		});

		expect(send).toHaveBeenCalledWith('/api/assignment-deletion-status', {
			method: 'POST',
			body: {
				assignmentId: deletedAssignment.id,
				action: 'restore'
			}
		});
		expect(result.status).toBe('updated');
	});
});
