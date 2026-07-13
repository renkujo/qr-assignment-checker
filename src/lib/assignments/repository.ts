import type PocketBase from 'pocketbase';
import type { IClassRecord } from '$lib/classes';

export type AssignmentStatus = 'draft' | 'active' | 'closed';

export interface IAssignmentRecord {
	id: string;
	class: string;
	class_code: string;
	subject: string;
	title: string;
	due_date: string;
	status: AssignmentStatus;
	created_by: string;
	deleted_at: string;
	deleted_by: string;
}

export interface IAssignmentListItem {
	id: string;
	classId: string;
	classCode: string;
	subject: string;
	title: string;
	dueDate: string;
	status: AssignmentStatus;
	deletedAt: string;
	deletedBy: string;
	isDeleted: boolean;
}

export interface IListAssignmentsInput {
	pb: PocketBase;
	classId: string;
}

export interface ICreateAssignmentInput {
	pb: PocketBase;
	classRecord: IClassRecord;
	teacherId: string;
	title: string;
	dueDate?: string;
}

export interface IGetAssignmentInput {
	pb: PocketBase;
	assignmentId: string;
}

export type AssignmentDeletionAction = 'delete' | 'restore';

export interface IUpdateAssignmentDeletionStatusInput {
	pb: PocketBase;
	assignmentId: string;
	action: AssignmentDeletionAction;
}

export interface IUpdateAssignmentDeletionStatusResult {
	status: 'updated' | 'unchanged';
	action: AssignmentDeletionAction;
	assignmentId: string;
	deletedAt: string;
	message: string;
}

export interface IUpdateAssignmentStatusInput {
	pb: PocketBase;
	assignmentId: string;
	status: Extract<AssignmentStatus, 'active' | 'closed'>;
}

const mapAssignmentRecord = (assignment: IAssignmentRecord): IAssignmentListItem => {
	return {
		id: assignment.id,
		classId: assignment.class,
		classCode: assignment.class_code,
		subject: assignment.subject,
		title: assignment.title,
		dueDate: assignment.due_date,
		status: assignment.status,
		deletedAt: assignment.deleted_at,
		deletedBy: assignment.deleted_by,
		isDeleted: Boolean(assignment.deleted_at)
	};
};

export const listAssignments = async ({
	pb,
	classId
}: IListAssignmentsInput): Promise<IAssignmentListItem[]> => {
	const assignments = await pb.collection('assignments').getFullList<IAssignmentRecord>({
		filter: pb.filter('class = {:classId} && deleted_at = ""', { classId })
	});

	return assignments.map(mapAssignmentRecord);
};

export const listDeletedAssignments = async ({
	pb,
	classId
}: IListAssignmentsInput): Promise<IAssignmentListItem[]> => {
	const assignments = await pb.collection('assignments').getFullList<IAssignmentRecord>({
		filter: pb.filter('class = {:classId} && deleted_at != ""', { classId }),
		sort: '-deleted_at'
	});

	return assignments.map(mapAssignmentRecord);
};

export const createAssignment = async ({
	pb,
	classRecord,
	teacherId,
	title,
	dueDate
}: ICreateAssignmentInput): Promise<IAssignmentListItem> => {
	const assignment = await pb.collection('assignments').create<IAssignmentRecord>({
		class: classRecord.id,
		class_code: classRecord.class_code,
		subject: classRecord.subject,
		title: title.trim(),
		due_date: dueDate || undefined,
		status: 'active',
		created_by: teacherId
	});

	return mapAssignmentRecord(assignment);
};

export const getAssignment = async ({
	pb,
	assignmentId
}: IGetAssignmentInput): Promise<IAssignmentListItem> => {
	const assignment = await pb.collection('assignments').getOne<IAssignmentRecord>(assignmentId);

	if (assignment.deleted_at) {
		throw new Error('Assignment is deleted');
	}

	return mapAssignmentRecord(assignment);
};

export const updateAssignmentDeletionStatus = async ({
	pb,
	assignmentId,
	action
}: IUpdateAssignmentDeletionStatusInput): Promise<IUpdateAssignmentDeletionStatusResult> => {
	return pb.send<IUpdateAssignmentDeletionStatusResult>('/api/assignment-deletion-status', {
		method: 'POST',
		body: {
			assignmentId,
			action
		}
	});
};

export const updateAssignmentStatus = async ({
	pb,
	assignmentId,
	status
}: IUpdateAssignmentStatusInput): Promise<IAssignmentListItem> => {
	const assignment = await pb.collection('assignments').update<IAssignmentRecord>(assignmentId, {
		status
	});

	return mapAssignmentRecord(assignment);
};
