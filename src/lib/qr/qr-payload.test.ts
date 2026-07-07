import { describe, expect, it } from 'vitest';
import { createStudentQrPayload } from './create-qr-payload';
import { parseStudentQrPayload } from './parse-qr-payload';

describe('student QR payload', () => {
	it('creates an opaque student QR payload', () => {
		expect(createStudentQrPayload({ qrToken: 'abc123' })).toBe('student:abc123');
	});

	it('parses a valid student QR payload', () => {
		expect(parseStudentQrPayload('student:abc123')).toEqual({
			type: 'student',
			qrToken: 'abc123'
		});
	});

	it('rejects unsupported QR payloads', () => {
		expect(parseStudentQrPayload('student-id:1')).toBeNull();
	});
});
