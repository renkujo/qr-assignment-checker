import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureDefaultClass } from '$lib/classes';
import { createQrDataUrl } from '$lib/qr/create-qr-data-url.server';
import { listStudents } from '$lib/students';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/app/students/print');
	}

	try {
		const classRecord = await ensureDefaultClass({
			pb: locals.pb,
			teacherId: locals.user.id
		});
		const students = await listStudents({
			pb: locals.pb,
			classId: classRecord.id
		});
		const cards = await Promise.all(
			students.map(async (student) => ({
				...student,
				qrImageDataUrl: await createQrDataUrl({ payload: student.qrPayload })
			}))
		);

		return {
			classRecord,
			cards,
			unavailable: false
		};
	} catch {
		return {
			classRecord: null,
			cards: [],
			unavailable: true
		};
	}
};
