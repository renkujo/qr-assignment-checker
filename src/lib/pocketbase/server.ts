import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import PocketBase, { type AuthRecord } from 'pocketbase';

const defaultPocketBaseUrl = 'http://127.0.0.1:8090';

export interface ICreateServerPocketBaseInput {
	cookie?: string | null;
}

export interface ISerializedAuthUser {
	id: string;
	email: string;
	name: string;
	schoolName: string;
}

export const createServerPocketBase = ({
	cookie
}: ICreateServerPocketBaseInput = {}): PocketBase => {
	const pb = new PocketBase(
		privateEnv.POCKETBASE_URL || publicEnv.PUBLIC_POCKETBASE_URL || defaultPocketBaseUrl
	);
	pb.authStore.loadFromCookie(cookie || '');

	return pb;
};

export const serializePocketBaseAuthCookie = (pb: PocketBase, secure: boolean): string => {
	return pb.authStore.exportToCookie({
		httpOnly: true,
		sameSite: 'lax',
		secure,
		path: '/'
	});
};

export const serializeAuthUser = (record: AuthRecord | null): ISerializedAuthUser | null => {
	if (!record) {
		return null;
	}

	return {
		id: record.id,
		email: String(record.email || ''),
		name: String(record.name || ''),
		schoolName: String(record.school_name || '')
	};
};
