import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const defaultRedirectPath = '/app';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		redirect(303, url.searchParams.get('redirectTo') || defaultRedirectPath);
	}

	return {
		redirectTo: url.searchParams.get('redirectTo') || defaultRedirectPath
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') || '').trim();
		const password = String(formData.get('password') || '');
		const redirectTo = String(formData.get('redirectTo') || defaultRedirectPath);

		if (!email || !password) {
			return fail(400, {
				email,
				message: 'กรอกอีเมลและรหัสผ่านก่อนเข้าสู่ระบบ'
			});
		}

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch {
			return fail(400, {
				email,
				message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
			});
		}

		redirect(303, redirectTo || defaultRedirectPath);
	}
};
