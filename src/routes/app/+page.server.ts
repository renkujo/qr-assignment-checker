import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/app');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		locals.pb.authStore.clear();
		redirect(303, '/login');
	}
};
