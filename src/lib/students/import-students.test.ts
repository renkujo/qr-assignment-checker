import { describe, expect, it } from 'vitest';
import { parseStudentImportText } from './import-students';

describe('parseStudentImportText', () => {
	it('parses Thai CSV with header', () => {
		const result = parseStudentImportText('เลขที่,ชื่อ-นามสกุล\n1,เด็กชายเอ\n2,เด็กหญิงบี');

		expect(result.rows).toEqual([
			{ rowNumber: 2, studentNo: '1', fullName: 'เด็กชายเอ' },
			{ rowNumber: 3, studentNo: '2', fullName: 'เด็กหญิงบี' }
		]);
		expect(result.skippedRows).toEqual([]);
	});

	it('parses CSV without header', () => {
		const result = parseStudentImportText('1,เด็กชายเอ\n2,เด็กหญิงบี');

		expect(result.rows).toHaveLength(2);
		expect(result.rows[0]).toMatchObject({ rowNumber: 1, studentNo: '1', fullName: 'เด็กชายเอ' });
	});

	it('parses tab separated rows copied from a spreadsheet', () => {
		const result = parseStudentImportText('เลขที่\tชื่อ-นามสกุล\n1\tเด็กชายเอ\n2\tเด็กหญิงบี');

		expect(result.rows).toEqual([
			{ rowNumber: 2, studentNo: '1', fullName: 'เด็กชายเอ' },
			{ rowNumber: 3, studentNo: '2', fullName: 'เด็กหญิงบี' }
		]);
	});

	it('skips empty and duplicate student number rows', () => {
		const result = parseStudentImportText('1,เด็กชายเอ\n,ไม่มีเลขที่\n1,เลขซ้ำ');

		expect(result.rows).toEqual([{ rowNumber: 1, studentNo: '1', fullName: 'เด็กชายเอ' }]);
		expect(result.skippedRows).toEqual([
			{
				rowNumber: 2,
				studentNo: '',
				fullName: 'ไม่มีเลขที่',
				reason: 'ไม่มีเลขที่หรือชื่อ-นามสกุล'
			},
			{ rowNumber: 3, studentNo: '1', fullName: 'เลขซ้ำ', reason: 'เลขที่ซ้ำในไฟล์ import' }
		]);
	});

	it('supports quoted CSV names with commas', () => {
		const result = parseStudentImportText('เลขที่,ชื่อ-นามสกุล\n1,"เด็กชายเอ, ห้องหนึ่ง"');

		expect(result.rows).toEqual([
			{ rowNumber: 2, studentNo: '1', fullName: 'เด็กชายเอ, ห้องหนึ่ง' }
		]);
	});
});
