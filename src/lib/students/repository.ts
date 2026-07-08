import type PocketBase from 'pocketbase';
import type { IClassRecord } from '$lib/classes';
import { createStudentQrPayload } from '$lib/qr';

export interface IStudentRecord {
	id: string;
	class: string;
	class_code: string;
	student_no: string;
	full_name: string;
	qr_token: string;
	active: boolean;
}

export interface IStudentListItem {
	id: string;
	studentNo: string;
	fullName: string;
	qrToken: string;
	qrPayload: string;
	active: boolean;
}

export interface IListStudentsInput {
	pb: PocketBase;
	classId: string;
}

export interface ICreateStudentInput {
	pb: PocketBase;
	classRecord: IClassRecord;
	studentNo: string;
	fullName: string;
}

const createQrToken = (): string => {
	return crypto.randomUUID().replaceAll('-', '');
};

const studentNumberCollator = new Intl.Collator('th', {
	numeric: true,
	sensitivity: 'base'
});

const mapStudentRecord = (student: IStudentRecord): IStudentListItem => {
	return {
		id: student.id,
		studentNo: student.student_no,
		fullName: student.full_name,
		qrToken: student.qr_token,
		qrPayload: createStudentQrPayload({ qrToken: student.qr_token }),
		active: student.active
	};
};

export const compareStudentListItems = (
	firstStudent: IStudentListItem,
	secondStudent: IStudentListItem
): number => {
	const studentNoCompare = studentNumberCollator.compare(
		firstStudent.studentNo,
		secondStudent.studentNo
	);

	if (studentNoCompare !== 0) {
		return studentNoCompare;
	}

	return firstStudent.fullName.localeCompare(secondStudent.fullName, 'th');
};

export const listStudents = async ({
	pb,
	classId
}: IListStudentsInput): Promise<IStudentListItem[]> => {
	const students = await pb.collection('students').getFullList<IStudentRecord>({
		filter: pb.filter('class = {:classId} && active = true', { classId }),
		sort: 'student_no'
	});

	return students.map(mapStudentRecord).sort(compareStudentListItems);
};

export const createStudent = async ({
	pb,
	classRecord,
	studentNo,
	fullName
}: ICreateStudentInput): Promise<IStudentListItem> => {
	const student = await pb.collection('students').create<IStudentRecord>({
		class: classRecord.id,
		class_code: classRecord.class_code,
		student_no: studentNo.trim(),
		full_name: fullName.trim(),
		qr_token: createQrToken(),
		active: true
	});

	return mapStudentRecord(student);
};
