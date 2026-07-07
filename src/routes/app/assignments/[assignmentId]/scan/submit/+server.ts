import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scanSubmission } from '$lib/submissions';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		redirect(303, `/login?redirectTo=/app/assignments/${params.assignmentId}/scan`);
	}

	try {
		const body = (await request.json()) as { qrPayload?: unknown };
		const qrPayload = String(body.qrPayload || '').trim();

		if (!qrPayload) {
			return json(
				{
					status: 'invalid',
					message: 'ไม่พบข้อมูล QR'
				},
				{ status: 400 }
			);
		}

		const result = await scanSubmission({
			pb: locals.pb,
			assignmentId: params.assignmentId,
			teacherId: locals.user.id,
			qrPayload
		});

		return json(result, {
			status: result.status === 'submitted' || result.status === 'duplicate' ? 200 : 400
		});
	} catch {
		return json(
			{
				status: 'invalid',
				message: 'บันทึกผลสแกนไม่สำเร็จ'
			},
			{ status: 500 }
		);
	}
};
