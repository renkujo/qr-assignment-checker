export const SCAN_PAYLOAD_COOLDOWN_MS = 4000;

interface IRememberScanPayloadInput {
	recentPayloads: Map<string, number>;
	payload: string;
	now?: number;
	cooldownMs?: number;
}

export const rememberScanPayload = ({
	recentPayloads,
	payload,
	now = Date.now(),
	cooldownMs = SCAN_PAYLOAD_COOLDOWN_MS
}: IRememberScanPayloadInput): boolean => {
	const expiresBefore = now - cooldownMs;

	for (const [recentPayload, scannedAt] of recentPayloads) {
		if (scannedAt <= expiresBefore) {
			recentPayloads.delete(recentPayload);
		}
	}

	if (recentPayloads.has(payload)) {
		return false;
	}

	recentPayloads.set(payload, now);
	return true;
};
