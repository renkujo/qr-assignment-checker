import { describe, expect, it } from 'vitest';
import { compareStudentListItems, type IStudentListItem } from './repository';

const createStudent = (
	studentNo: string,
	fullName = `นักเรียน ${studentNo}`
): IStudentListItem => ({
	id: studentNo,
	studentNo,
	fullName,
	qrToken: `token-${studentNo}`,
	qrPayload: `student:token-${studentNo}`,
	active: true
});

describe('compareStudentListItems', () => {
	it('sorts numeric student numbers from low to high', () => {
		const students = ['1', '10', '2', '20', '3'].map((studentNo) => createStudent(studentNo));

		expect(students.sort(compareStudentListItems).map((student) => student.studentNo)).toEqual([
			'1',
			'2',
			'3',
			'10',
			'20'
		]);
	});

	it('uses Thai name ordering when student numbers match', () => {
		const students = [createStudent('7', 'เด็กหญิงบี'), createStudent('7', 'เด็กชายเอ')];

		expect(students.sort(compareStudentListItems).map((student) => student.fullName)).toEqual([
			'เด็กชายเอ',
			'เด็กหญิงบี'
		]);
	});
});
