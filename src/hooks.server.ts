import type { Handle } from '@sveltejs/kit';
import {
	createServerPocketBase,
	serializeAuthUser,
	serializePocketBaseAuthCookie
} from '$lib/pocketbase/server';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.pb = createServerPocketBase({
		cookie: event.request.headers.get('cookie')
	});

	try {
		if (event.locals.pb.authStore.isValid) {
			await event.locals.pb.collection('users').authRefresh();
		}
	} catch {
		event.locals.pb.authStore.clear();
	}

	event.locals.user = serializeAuthUser(event.locals.pb.authStore.record);

	const response = await resolve(event);

	response.headers.append(
		'set-cookie',
		serializePocketBaseAuthCookie(event.locals.pb, event.url.protocol === 'https:')
	);

	return response;
};
