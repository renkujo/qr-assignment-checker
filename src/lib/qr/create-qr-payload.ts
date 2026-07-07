export interface ICreateStudentQrPayloadInput {
	qrToken: string;
}

export const createStudentQrPayload = ({ qrToken }: ICreateStudentQrPayloadInput): string => {
	const token = qrToken.trim();

	if (!token) {
		throw new Error('QR token is required');
	}

	return `student:${token}`;
};
