export interface IParsedStudentQrPayload {
	type: 'student';
	qrToken: string;
}

const studentQrPrefix = 'student:';

export const parseStudentQrPayload = (payload: string): IParsedStudentQrPayload | null => {
	const value = payload.trim();

	if (!value.startsWith(studentQrPrefix)) {
		return null;
	}

	const qrToken = value.slice(studentQrPrefix.length).trim();

	if (!qrToken) {
		return null;
	}

	return {
		type: 'student',
		qrToken
	};
};
