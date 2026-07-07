import { env } from '$env/dynamic/public';
import PocketBase from 'pocketbase';

const defaultPocketBaseUrl = 'http://127.0.0.1:8090';

export const createPocketBaseClient = (baseUrl = env.PUBLIC_POCKETBASE_URL): PocketBase => {
	return new PocketBase(baseUrl || defaultPocketBaseUrl);
};
