import { error } from '@sveltejs/kit';
import type PocketBase from 'pocketbase';
import type { RequestHandler } from './$types';
import { getAssignment } from '$lib/assignments';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface ISseEvent {
	event: string;
	data: string;
	id: string;
}

const createSseMessage = (event: string, data: Record<string, unknown>): Uint8Array => {
	return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

const parseSseEvent = (message: string): ISseEvent => {
	const event: ISseEvent = {
		event: 'message',
		data: '',
		id: ''
	};
	const dataLines: string[] = [];

	for (const line of message.split('\n')) {
		if (line.startsWith('event:')) {
			event.event = line.slice('event:'.length).trim();
		} else if (line.startsWith('data:')) {
			dataLines.push(line.slice('data:'.length).trimStart());
		} else if (line.startsWith('id:')) {
			event.id = line.slice('id:'.length).trim();
		}
	}

	event.data = dataLines.join('\n');

	return event;
};

const createSubscriptionTopic = (filter: string): string => {
	const options = encodeURIComponent(
		JSON.stringify({
			query: { filter }
		})
	);

	return `submissions/*?options=${options}`;
};

const sendPocketBaseSubscriptions = async ({
	pb,
	clientId,
	topic
}: {
	pb: PocketBase;
	clientId: string;
	topic: string;
}) => {
	await fetch(`${pb.baseUrl}/api/realtime`, {
		method: 'POST',
		headers: {
			authorization: pb.authStore.token,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			clientId,
			subscriptions: [topic]
		})
	});
};

export const GET: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		error(401, 'ต้องเข้าสู่ระบบก่อน');
	}

	const assignment = await getAssignment({
		pb: locals.pb,
		assignmentId: params.assignmentId
	});
	const filter = locals.pb.filter('assignment = {:assignmentId}', {
		assignmentId: assignment.id
	});
	const topic = createSubscriptionTopic(filter);

	const stream = new ReadableStream<Uint8Array>({
		start: async (controller) => {
			const pocketBaseStreamAbort = new AbortController();
			let buffer = '';
			let closed = false;

			const safeEnqueue = (event: string, data: Record<string, unknown>) => {
				if (!closed) {
					controller.enqueue(createSseMessage(event, data));
				}
			};

			const close = () => {
				if (closed) {
					return;
				}

				closed = true;
				pocketBaseStreamAbort.abort();

				try {
					controller.close();
				} catch {
					// Client already disconnected.
				}
			};

			request.signal.addEventListener('abort', close);
			safeEnqueue('ready', {
				assignmentId: assignment.id
			});

			try {
				const pocketBaseResponse = await fetch(`${locals.pb.baseUrl}/api/realtime`, {
					signal: pocketBaseStreamAbort.signal
				});

				if (!pocketBaseResponse.body) {
					throw new Error('PocketBase realtime stream has no body');
				}

				const reader = pocketBaseResponse.body.getReader();

				while (!closed) {
					const { done, value } = await reader.read();

					if (done) {
						break;
					}

					buffer += decoder.decode(value, { stream: true });
					const messages = buffer.split('\n\n');
					buffer = messages.pop() || '';

					for (const message of messages) {
						const event = parseSseEvent(message);

						if (event.event === 'PB_CONNECT' && event.id) {
							await sendPocketBaseSubscriptions({
								pb: locals.pb,
								clientId: event.id,
								topic
							});
							continue;
						}

						if (event.event.startsWith('submissions/')) {
							safeEnqueue('change', {
								assignmentId: assignment.id,
								event: event.event,
								data: event.data
							});
						}
					}
				}
			} catch (realtimeError) {
				if (!closed) {
					safeEnqueue('error', {
						message:
							realtimeError instanceof Error ? realtimeError.message : 'realtime stream failed'
					});
				}
			} finally {
				close();
			}
		},
		cancel: () => {
			// The request abort listener performs cleanup.
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive'
		}
	});
};
