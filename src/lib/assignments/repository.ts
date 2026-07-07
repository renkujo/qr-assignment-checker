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
}

export interface IAssignmentListItem {
	id: string;
	classId: string;
	classCode: string;
	subject: string;
	title: string;
	dueDate: string;
	status: AssignmentStatus;
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
		status: assignment.status
	};
};

export const listAssignments = async ({
	pb,
	classId
}: IListAssignmentsInput): Promise<IAssignmentListItem[]> => {
	const assignments = await pb.collection('assignments').getFullList<IAssignmentRecord>({
		filter: pb.filter('class = {:classId}', { classId })
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

	return mapAssignmentRecord(assignment);
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
