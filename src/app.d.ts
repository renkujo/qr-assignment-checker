import type PocketBase from 'pocketbase';
import type { ISerializedAuthUser } from '$lib/pocketbase/server';

declare global {
	namespace App {
		interface Locals {
			pb: PocketBase;
			user: ISerializedAuthUser | null;
		}

		interface PageData {
			user?: ISerializedAuthUser | null;
		}
	}
}

export {};
