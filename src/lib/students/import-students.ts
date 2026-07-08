export interface IParsedStudentImportRow {
	rowNumber: number;
	studentNo: string;
	fullName: string;
}

export interface ISkippedStudentImportRow {
	rowNumber: number;
	studentNo: string;
	fullName: string;
	reason: string;
}

export interface IParseStudentImportTextResult {
	rows: IParsedStudentImportRow[];
	skippedRows: ISkippedStudentImportRow[];
	truncated: boolean;
}

const maxImportRows = 100;

const normalizeCell = (value: string): string => {
	return value.trim().replace(/^\uFEFF/, '');
};

const parseDelimitedLine = (line: string, delimiter: ',' | '\t'): string[] => {
	if (delimiter === '\t') {
		return line.split('\t').map(normalizeCell);
	}

	const cells: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const character = line[index];
		const nextCharacter = line[index + 1];

		if (character === '"' && inQuotes && nextCharacter === '"') {
			current += '"';
			index += 1;
			continue;
		}

		if (character === '"') {
			inQuotes = !inQuotes;
			continue;
		}

		if (character === delimiter && !inQuotes) {
			cells.push(normalizeCell(current));
			current = '';
			continue;
		}

		current += character;
	}

	cells.push(normalizeCell(current));

	return cells;
};

const isHeaderRow = ([firstCell = '', secondCell = '']: string[]): boolean => {
	const first = firstCell.toLowerCase();
	const second = secondCell.toLowerCase();

	return (
		first.includes('เลข') ||
		first.includes('no') ||
		first.includes('number') ||
		second.includes('ชื่อ') ||
		second.includes('name')
	);
};

export const parseStudentImportText = (input: string): IParseStudentImportTextResult => {
	const delimiter = input.includes('\t') ? '\t' : ',';
	const sourceLines = input
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.split('\n')
		.map((line, index) => ({ line, rowNumber: index + 1 }))
		.filter(({ line }) => line.trim().length > 0);

	const [firstLine] = sourceLines;
	const hasHeader = firstLine ? isHeaderRow(parseDelimitedLine(firstLine.line, delimiter)) : false;
	const dataLines = hasHeader ? sourceLines.slice(1) : sourceLines;
	const rows: IParsedStudentImportRow[] = [];
	const skippedRows: ISkippedStudentImportRow[] = [];
	const seenStudentNumbers = new Set<string>();
	const limitedLines = dataLines.slice(0, maxImportRows);

	for (const { line, rowNumber } of limitedLines) {
		const [studentNoValue = '', ...nameCells] = parseDelimitedLine(line, delimiter);
		const studentNo = normalizeCell(studentNoValue);
		const fullName = normalizeCell(nameCells.join(delimiter === '\t' ? ' ' : ','));

		if (!studentNo || !fullName) {
			skippedRows.push({
				rowNumber,
				studentNo,
				fullName,
				reason: 'ไม่มีเลขที่หรือชื่อ-นามสกุล'
			});
			continue;
		}

		if (seenStudentNumbers.has(studentNo)) {
			skippedRows.push({
				rowNumber,
				studentNo,
				fullName,
				reason: 'เลขที่ซ้ำในไฟล์ import'
			});
			continue;
		}

		seenStudentNumbers.add(studentNo);
		rows.push({ rowNumber, studentNo, fullName });
	}

	if (dataLines.length > maxImportRows) {
		skippedRows.push({
			rowNumber: maxImportRows + 1,
			studentNo: '',
			fullName: '',
			reason: `นำเข้าได้สูงสุด ${maxImportRows} แถวต่อครั้ง`
		});
	}

	return {
		rows,
		skippedRows,
		truncated: dataLines.length > maxImportRows
	};
};
