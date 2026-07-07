import type PocketBase from 'pocketbase';

export interface IClassRecord {
	id: string;
	name: string;
	subject: string;
	class_code: string;
	teacher: string;
	active: boolean;
}

export interface IEnsureDefaultClassInput {
	pb: PocketBase;
	teacherId: string;
}

const createDefaultClassCode = (teacherId: string): string => {
	return `DEFAULT-${teacherId.slice(0, 8).toUpperCase()}`;
};

export const ensureDefaultClass = async ({
	pb,
	teacherId
}: IEnsureDefaultClassInput): Promise<IClassRecord> => {
	const classList = await pb.collection('classes').getList<IClassRecord>(1, 1, {
		filter: pb.filter('teacher = {:teacherId} && active = true', { teacherId })
	});

	const existingClass = classList.items[0];

	if (existingClass) {
		return existingClass;
	}

	return pb.collection('classes').create<IClassRecord>({
		name: 'ห้องเริ่มต้น',
		subject: 'วิชาเริ่มต้น',
		class_code: createDefaultClassCode(teacherId),
		teacher: teacherId,
		active: true
	});
};
