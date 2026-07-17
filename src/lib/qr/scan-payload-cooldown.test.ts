import { describe, expect, it } from 'vitest';
import { rememberScanPayload } from './scan-payload-cooldown';

describe('rememberScanPayload', () => {
	it('blocks the same QR during cooldown while allowing the next student immediately', () => {
		const recentPayloads = new Map<string, number>();

		expect(
			rememberScanPayload({ recentPayloads, payload: 'student:first', now: 1000, cooldownMs: 4000 })
		).toBe(true);
		expect(
			rememberScanPayload({ recentPayloads, payload: 'student:first', now: 1500, cooldownMs: 4000 })
		).toBe(false);
		expect(
			rememberScanPayload({
				recentPayloads,
				payload: 'student:second',
				now: 1500,
				cooldownMs: 4000
			})
		).toBe(true);
	});

	it('accepts the same QR again after cooldown expires', () => {
		const recentPayloads = new Map<string, number>([['student:first', 1000]]);

		expect(
			rememberScanPayload({ recentPayloads, payload: 'student:first', now: 5000, cooldownMs: 4000 })
		).toBe(true);
		expect(recentPayloads.get('student:first')).toBe(5000);
	});
});
