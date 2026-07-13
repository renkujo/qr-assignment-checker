#!/usr/bin/env node
import { spawn } from 'node:child_process';
import PocketBase from 'pocketbase';

const pocketBaseUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const appUrl = process.env.QR_APP_URL || 'http://127.0.0.1:5187';
const appUrlObject = new URL(appUrl);
let startedAppServer = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchText = async (url, options) => {
	const response = await fetch(url, options);
	return {
		response,
		text: await response.text()
	};
};

const assert = (condition, message) => {
	if (!condition) {
		throw new Error(message);
	}
};

const checkPocketBase = async () => {
	try {
		const response = await fetch(`${pocketBaseUrl}/api/health`);
		assert(response.ok, `PocketBase health returned ${response.status}`);
	} catch (error) {
		throw new Error(
			`PocketBase is not ready at ${pocketBaseUrl}. Run \`pnpm pb:serve\` first. ${String(error)}`,
			{ cause: error }
		);
	}
};

const getRunningAppStatus = async () => {
	try {
		const { response, text } = await fetchText(`${appUrl}/login`);
		return {
			isRunning: response.ok,
			isQrApp: text.includes('QR Assignment Checker')
		};
	} catch {
		return {
			isRunning: false,
			isQrApp: false
		};
	}
};

const startAppServer = async () => {
	const runningStatus = await getRunningAppStatus();

	if (runningStatus.isRunning && runningStatus.isQrApp) {
		return;
	}

	if (runningStatus.isRunning && !runningStatus.isQrApp) {
		throw new Error(`${appUrl} is already serving another app. Set QR_APP_URL to a free port.`);
	}

	startedAppServer = spawn(
		'pnpm',
		['dev', '--host', appUrlObject.hostname, '--port', appUrlObject.port || '5187'],
		{
			cwd: process.cwd(),
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);

	let serverOutput = '';
	startedAppServer.stdout.on('data', (chunk) => {
		serverOutput += chunk.toString();
	});
	startedAppServer.stderr.on('data', (chunk) => {
		serverOutput += chunk.toString();
	});

	for (let attempt = 0; attempt < 80; attempt += 1) {
		const status = await getRunningAppStatus();

		if (status.isRunning && status.isQrApp) {
			return;
		}

		if (startedAppServer.exitCode !== null) {
			throw new Error(`SvelteKit dev server exited early.\n${serverOutput}`);
		}

		await wait(250);
	}

	throw new Error(`SvelteKit dev server did not become ready.\n${serverOutput}`);
};

const stopAppServer = () => {
	if (startedAppServer && startedAppServer.exitCode === null) {
		startedAppServer.kill();
	}
};

const createFixture = async (pb) => {
	const stamp = Date.now();
	const email = `teacher-mvp-smoke-${stamp}@example.test`;
	const password = `MvpSmokePass-${stamp}!`;
	const teacher = await pb.collection('users').create({
		email,
		password,
		passwordConfirm: password,
		name: 'MVP Smoke Teacher',
		emailVisibility: true
	});
	await pb.collection('users').authWithPassword(email, password);

	const classRecord = await pb.collection('classes').create({
		name: 'MVP Smoke Class',
		subject: 'MVP Smoke Subject',
		class_code: `MVP-${stamp}`,
		teacher: teacher.id,
		active: true
	});
	const submittedToken = crypto.randomUUID().replaceAll('-', '');
	const missingToken = crypto.randomUUID().replaceAll('-', '');
	const submittedStudent = await pb.collection('students').create({
		class: classRecord.id,
		class_code: classRecord.class_code,
		student_no: '1',
		full_name: 'MVP ส่งแล้ว',
		qr_token: submittedToken,
		active: true
	});
	const missingStudent = await pb.collection('students').create({
		class: classRecord.id,
		class_code: classRecord.class_code,
		student_no: '2',
		full_name: 'MVP ยังไม่ส่ง',
		qr_token: missingToken,
		active: true
	});
	const formulaStudent = await pb.collection('students').create({
		class: classRecord.id,
		class_code: classRecord.class_code,
		student_no: '99',
		full_name: '=HYPERLINK("https://example.test","x")',
		qr_token: crypto.randomUUID().replaceAll('-', ''),
		active: true
	});
	const assignment = await pb.collection('assignments').create({
		class: classRecord.id,
		class_code: classRecord.class_code,
		subject: classRecord.subject,
		title: 'MVP Smoke Assignment',
		status: 'active',
		created_by: teacher.id
	});

	return {
		teacher,
		classRecord,
		assignment,
		submittedStudent,
		missingStudent,
		formulaStudent,
		submittedToken,
		missingToken
	};
};

const createAuthCookie = (pb) => {
	return pb.authStore.exportToCookie({
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		path: '/'
	});
};

const postScan = async ({ assignmentId, cookie, qrPayload }) => {
	const response = await fetch(`${appUrl}/app/assignments/${assignmentId}/scan/submit`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			cookie
		},
		body: JSON.stringify({ qrPayload }),
		redirect: 'manual'
	});

	return {
		httpStatus: response.status,
		payload: await response.json()
	};
};

const setAssignmentStatus = async ({ assignmentId, cookie, status }) => {
	const formData = new URLSearchParams();
	formData.set('status', status);

	return fetch(`${appUrl}/app/assignments/${assignmentId}?/setStatus`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie
		},
		body: formData,
		redirect: 'manual'
	});
};

const setStudentSubmissionStatus = async ({
	assignmentId,
	studentId,
	cookie,
	expectedStatus,
	expectedUpdatedAt,
	targetStatus
}) => {
	const formData = new URLSearchParams();
	formData.set('studentId', studentId);
	formData.set('expectedStatus', expectedStatus);
	formData.set('expectedUpdatedAt', expectedUpdatedAt);
	formData.set('targetStatus', targetStatus);

	return fetch(`${appUrl}/app/assignments/${assignmentId}?/setStudentSubmissionStatus`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie
		},
		body: formData,
		redirect: 'manual'
	});
};

const deleteAssignment = async ({ assignmentId, cookie }) => {
	return fetch(`${appUrl}/app/assignments/${assignmentId}?/deleteAssignment`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie
		},
		redirect: 'manual'
	});
};

const restoreAssignment = async ({ assignmentId, cookie }) => {
	const formData = new URLSearchParams();
	formData.set('assignmentId', assignmentId);

	return fetch(`${appUrl}/app/assignments?/restore`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie
		},
		body: formData,
		redirect: 'manual'
	});
};

const assertStudentImport = async ({ pb, classRecord, cookie }) => {
	const formData = new URLSearchParams();
	formData.set(
		'importText',
		'เลขที่,ชื่อ-นามสกุล\n3,MVP Import สาม\n4,MVP Import สี่\n1,MVP เลขซ้ำ\n,ไม่มีเลขที่'
	);

	const response = await fetch(`${appUrl}/app/students?/import`, {
		method: 'POST',
		headers: {
			accept: 'text/html',
			'content-type': 'application/x-www-form-urlencoded',
			cookie
		},
		body: formData,
		redirect: 'manual'
	});

	assert(response.status === 200, `Expected import action 200, got ${response.status}`);

	const students = await pb.collection('students').getFullList({
		filter: pb.filter('class = {:classId} && active = true', { classId: classRecord.id }),
		sort: 'student_no'
	});
	const studentNumbers = students.map((student) => String(student.student_no));
	const importedStudent = students.find((student) => student.student_no === '3');

	assert(students.length === 5, `Expected 5 students after import, got ${students.length}`);
	assert(studentNumbers.includes('3'), 'Expected imported student number 3');
	assert(studentNumbers.includes('4'), 'Expected imported student number 4');
	assert(importedStudent?.qr_token, 'Expected imported student to have qr_token');
};

const assertDirectCreateBlocked = async ({
	pb,
	assignment,
	classRecord,
	submittedStudent,
	teacher
}) => {
	try {
		await pb.collection('submissions').create({
			assignment: assignment.id,
			student: submittedStudent.id,
			class_code: classRecord.class_code,
			submitted_by: teacher.id,
			submitted_at: new Date().toISOString(),
			scan_source: 'manual',
			submission_key: `${assignment.id}:${submittedStudent.id}`
		});
	} catch (error) {
		assert(error.status === 403, `Expected direct create to return 403, got ${error.status}`);
		return;
	}

	throw new Error('Direct submissions.create unexpectedly succeeded');
};

const assertCsvExport = async ({ assignmentId, cookie, phase = 'initial' }) => {
	const response = await fetch(`${appUrl}/app/assignments/${assignmentId}/export`, {
		headers: { cookie },
		redirect: 'manual'
	});
	const bytes = new Uint8Array(await response.arrayBuffer());
	const csv = new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');

	assert(response.status === 200, `Expected export 200, got ${response.status}`);
	assert(
		response.headers.get('content-type')?.includes('text/csv'),
		'Expected export content-type text/csv'
	);
	assert(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf, 'Expected CSV BOM');
	assert(
		csv.includes('"เลขที่","ชื่อ-นามสกุล","สถานะ","เวลาส่ง","วิธีบันทึก","อัปเดตสถานะล่าสุด"'),
		'Missing CSV header'
	);
	assert(
		csv.includes('"\'=HYPERLINK(""https://example.test"",""x"")"'),
		'Missing spreadsheet-safe formula prefix'
	);

	if (phase === 'manual-correction') {
		assert(
			csv.includes('"1","MVP ส่งแล้ว","ยังไม่ส่ง","","ครูปรับสถานะ"'),
			`Missing manually revoked row. CSV: ${csv}`
		);
		assert(
			csv.includes('"2","MVP ยังไม่ส่ง","ส่งแล้ว"') && csv.includes('"ครูปรับสถานะ"'),
			'Missing manually submitted row'
		);
		return;
	}

	assert(
		csv.includes('"1","MVP ส่งแล้ว","ส่งแล้ว"') && csv.includes('"สแกน QR"'),
		`Missing scanned submitted row. CSV: ${csv}`
	);
	assert(csv.includes('"2","MVP ยังไม่ส่ง","ยังไม่ส่ง",""'), 'Missing missing row');
};

const assertRealtimeChange = async ({ assignmentId, cookie, trigger, label }) => {
	const controller = new AbortController();
	const response = await fetch(`${appUrl}/app/assignments/${assignmentId}/events`, {
		headers: { cookie },
		signal: controller.signal
	});

	assert(response.status === 200, `Expected realtime events 200, got ${response.status}`);
	assert(response.body, 'Expected realtime events response body');

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const timeoutAt = Date.now() + 7000;
	let buffer = '';
	let sawReady = false;
	let sawChange = false;
	let triggerResult = null;

	try {
		while (Date.now() < timeoutAt) {
			const remainingTime = Math.max(0, timeoutAt - Date.now());
			const readResult = await Promise.race([
				reader.read(),
				wait(remainingTime).then(() => ({ done: true, value: undefined, timedOut: true }))
			]);

			if ('timedOut' in readResult) {
				break;
			}

			const { done, value } = readResult;

			if (done) {
				break;
			}

			buffer += decoder.decode(value, { stream: true });

			if (buffer.includes('event: ready') && !sawReady) {
				sawReady = true;
				triggerResult = await trigger();
			}

			if (buffer.includes('event: change')) {
				sawChange = true;
				break;
			}
		}
	} finally {
		controller.abort();
		try {
			await reader.cancel();
		} catch {
			// Reader may already be closed by abort.
		}
	}

	assert(sawReady, `Expected realtime ready event for ${label}`);
	assert(
		sawChange,
		`Expected realtime change event for ${label}. Trigger result: ${JSON.stringify(
			triggerResult instanceof Response
				? { status: triggerResult.status, statusText: triggerResult.statusText }
				: triggerResult
		)}`
	);

	return triggerResult;
};

const main = async () => {
	await checkPocketBase();
	await startAppServer();

	const pb = new PocketBase(pocketBaseUrl);
	const fixture = await createFixture(pb);
	const cookie = createAuthCookie(pb);
	const qrPayload = `student:${fixture.submittedToken}`;

	await assertStudentImport({ pb, classRecord: fixture.classRecord, cookie });
	await assertDirectCreateBlocked({ pb, ...fixture });

	const firstScan = await assertRealtimeChange({
		assignmentId: fixture.assignment.id,
		cookie,
		label: 'initial scan',
		trigger: () => postScan({ assignmentId: fixture.assignment.id, cookie, qrPayload })
	});
	assert(firstScan?.httpStatus === 200, `Expected first scan 200, got ${firstScan?.httpStatus}`);
	assert(
		firstScan.payload.status === 'submitted',
		`Expected submitted, got ${firstScan.payload.status}`
	);

	const duplicateScan = await postScan({ assignmentId: fixture.assignment.id, cookie, qrPayload });
	assert(
		duplicateScan.httpStatus === 200,
		`Expected duplicate scan 200, got ${duplicateScan.httpStatus}`
	);
	assert(
		duplicateScan.payload.status === 'duplicate',
		`Expected duplicate, got ${duplicateScan.payload.status}`
	);

	await assertCsvExport({ assignmentId: fixture.assignment.id, cookie });

	const closeResponse = await setAssignmentStatus({
		assignmentId: fixture.assignment.id,
		cookie,
		status: 'closed'
	});
	assert(closeResponse.status === 303, `Expected close redirect 303, got ${closeResponse.status}`);

	const closedAssignment = await pb.collection('assignments').getOne(fixture.assignment.id);
	assert(closedAssignment.status === 'closed', 'Expected assignment status closed');
	const submittedBeforeRevoke = await pb.collection('submissions').getFirstListItem(
		pb.filter('submission_key = {:submissionKey}', {
			submissionKey: `${fixture.assignment.id}:${fixture.submittedStudent.id}`
		})
	);

	const manualRevoke = await assertRealtimeChange({
		assignmentId: fixture.assignment.id,
		cookie,
		label: 'manual revoke',
		trigger: () =>
			setStudentSubmissionStatus({
				assignmentId: fixture.assignment.id,
				studentId: fixture.submittedStudent.id,
				cookie,
				expectedStatus: 'submitted',
				expectedUpdatedAt: submittedBeforeRevoke.status_updated_at,
				targetStatus: 'missing'
			})
	});
	assert(manualRevoke?.status === 200, `Expected manual revoke 200, got ${manualRevoke?.status}`);

	const revokedSubmission = await pb.collection('submissions').getFirstListItem(
		pb.filter('submission_key = {:submissionKey}', {
			submissionKey: `${fixture.assignment.id}:${fixture.submittedStudent.id}`
		})
	);
	assert(revokedSubmission.status === 'revoked', 'Expected submitted student to be revoked');

	const manualSubmit = await setStudentSubmissionStatus({
		assignmentId: fixture.assignment.id,
		studentId: fixture.missingStudent.id,
		cookie,
		expectedStatus: 'missing',
		expectedUpdatedAt: '',
		targetStatus: 'submitted'
	});
	assert(manualSubmit.status === 200, `Expected manual submit 200, got ${manualSubmit.status}`);

	const manuallySubmittedRecord = await pb.collection('submissions').getFirstListItem(
		pb.filter('submission_key = {:submissionKey}', {
			submissionKey: `${fixture.assignment.id}:${fixture.missingStudent.id}`
		})
	);
	assert(manuallySubmittedRecord.status === 'submitted', 'Expected missing student submitted');
	assert(manuallySubmittedRecord.scan_source === 'manual', 'Expected manual submission source');

	await assertCsvExport({
		assignmentId: fixture.assignment.id,
		cookie,
		phase: 'manual-correction'
	});

	const closedScan = await postScan({ assignmentId: fixture.assignment.id, cookie, qrPayload });
	assert(closedScan.httpStatus === 400, `Expected closed scan 400, got ${closedScan.httpStatus}`);
	assert(
		String(closedScan.payload.message || '').includes('ปิดรับ'),
		`Expected Thai closed message, got ${closedScan.payload.message}`
	);

	const openResponse = await setAssignmentStatus({
		assignmentId: fixture.assignment.id,
		cookie,
		status: 'active'
	});
	assert(openResponse.status === 303, `Expected reopen redirect 303, got ${openResponse.status}`);

	const reopenedAssignment = await pb.collection('assignments').getOne(fixture.assignment.id);
	assert(reopenedAssignment.status === 'active', 'Expected assignment status active');

	const reopenedScan = await postScan({ assignmentId: fixture.assignment.id, cookie, qrPayload });
	assert(
		reopenedScan.httpStatus === 200,
		`Expected reopened scan 200, got ${reopenedScan.httpStatus}`
	);
	assert(
		reopenedScan.payload.status === 'submitted',
		`Expected reopened scan to reactivate submission, got ${reopenedScan.payload.status}`
	);

	const duplicateAfterReactivation = await postScan({
		assignmentId: fixture.assignment.id,
		cookie,
		qrPayload
	});
	assert(
		duplicateAfterReactivation.payload.status === 'duplicate',
		`Expected duplicate after reactivation, got ${duplicateAfterReactivation.payload.status}`
	);

	const submissions = await pb.collection('submissions').getList(1, 10, {
		filter: pb.filter('assignment = {:assignmentId}', { assignmentId: fixture.assignment.id })
	});
	assert(
		submissions.totalItems === 2,
		`Expected exactly 2 submission records, got ${submissions.totalItems}`
	);

	const statusEvents = await pb.collection('submission_status_events').getList(1, 20, {
		filter: pb.filter('assignment = {:assignmentId}', { assignmentId: fixture.assignment.id })
	});
	assert(statusEvents.totalItems === 4, `Expected 4 audit events, got ${statusEvents.totalItems}`);

	const statusUiResponse = await fetch(`${appUrl}/app/assignments/${fixture.assignment.id}`, {
		headers: { cookie }
	});
	const statusUiHtml = await statusUiResponse.text();
	assert(statusUiHtml.includes('ยังไม่ได้ส่ง'), 'Missing not-submitted status control');
	assert(statusUiHtml.includes('ส่งแล้ว'), 'Missing submitted status control');
	assert(statusUiHtml.includes('ลบใบงาน'), 'Missing delete assignment control');
	assert(statusUiHtml.includes('<svg'), 'Missing rendered status icons');

	const outsiderPb = new PocketBase(pocketBaseUrl);
	const outsiderStamp = Date.now();
	const outsiderEmail = `assignment-outsider-${outsiderStamp}@example.test`;
	const outsiderPassword = `OutsiderPass-${outsiderStamp}!`;
	await outsiderPb.collection('users').create({
		email: outsiderEmail,
		password: outsiderPassword,
		passwordConfirm: outsiderPassword,
		name: 'Assignment Outsider',
		emailVisibility: true
	});
	await outsiderPb.collection('users').authWithPassword(outsiderEmail, outsiderPassword);

	try {
		await outsiderPb.send('/api/assignment-deletion-status', {
			method: 'POST',
			body: {
				assignmentId: fixture.assignment.id,
				action: 'delete'
			}
		});
		throw new Error('Cross-teacher assignment delete unexpectedly succeeded');
	} catch (outsiderError) {
		assert(
			outsiderError.status === 403,
			`Expected cross-teacher delete 403, got ${outsiderError.status}`
		);
	}

	try {
		await pb.collection('assignments').update(fixture.assignment.id, {
			deleted_at: new Date().toISOString(),
			deleted_by: fixture.teacher.id
		});
		throw new Error('Direct assignment lifecycle update unexpectedly succeeded');
	} catch (directLifecycleError) {
		assert(
			[400, 403, 404].includes(directLifecycleError.status),
			`Expected direct lifecycle update to be blocked, got ${directLifecycleError.status}`
		);
	}

	const deleteResponse = await deleteAssignment({
		assignmentId: fixture.assignment.id,
		cookie
	});
	assert(
		deleteResponse.status === 303,
		`Expected delete redirect 303, got ${deleteResponse.status}`
	);

	const deletedAssignment = await pb.collection('assignments').getOne(fixture.assignment.id);
	assert(deletedAssignment.status === 'closed', 'Expected deleted assignment to be closed');
	assert(deletedAssignment.deleted_at, 'Expected deleted_at after soft delete');
	assert(deletedAssignment.deleted_by === fixture.teacher.id, 'Expected deleted_by teacher');
	const repeatedDelete = await pb.send('/api/assignment-deletion-status', {
		method: 'POST',
		body: {
			assignmentId: fixture.assignment.id,
			action: 'delete'
		}
	});
	assert(repeatedDelete.status === 'unchanged', 'Expected repeated delete to be unchanged');

	try {
		await outsiderPb.send('/api/assignment-deletion-status', {
			method: 'POST',
			body: {
				assignmentId: fixture.assignment.id,
				action: 'restore'
			}
		});
		throw new Error('Cross-teacher assignment restore unexpectedly succeeded');
	} catch (outsiderRestoreError) {
		assert(
			outsiderRestoreError.status === 403,
			`Expected cross-teacher restore 403, got ${outsiderRestoreError.status}`
		);
	}

	const activeListResponse = await fetch(`${appUrl}/app/assignments`, {
		headers: { cookie }
	});
	const activeListHtml = await activeListResponse.text();
	assert(
		!activeListHtml.includes(fixture.assignment.title),
		'Deleted assignment leaked into active list'
	);

	const trashListResponse = await fetch(`${appUrl}/app/assignments?view=trash`, {
		headers: { cookie }
	});
	const trashListHtml = await trashListResponse.text();
	assert(
		trashListResponse.status === 200 && trashListHtml.includes(fixture.assignment.title),
		`Deleted assignment missing from trash. Status: ${trashListResponse.status}. Markers: ${JSON.stringify(
			{
				trashHeading: trashListHtml.includes('ใบงานที่ลบ'),
				emptyTrash: trashListHtml.includes('ถังขยะยังว่าง'),
				unavailable: trashListHtml.includes('PocketBase ยังไม่พร้อม'),
				activeHeading: trashListHtml.includes('งานที่ต้องตรวจ')
			}
		)}`
	);
	assert(trashListHtml.includes('กู้คืน'), 'Missing restore control in trash');

	for (const deletedRoute of [
		`/app/assignments/${fixture.assignment.id}`,
		`/app/assignments/${fixture.assignment.id}/scan`,
		`/app/assignments/${fixture.assignment.id}/export`
	]) {
		const deletedRouteResponse = await fetch(`${appUrl}${deletedRoute}`, {
			headers: { cookie },
			redirect: 'manual'
		});
		assert(
			deletedRouteResponse.status === 404,
			`Expected deleted route ${deletedRoute} to return 404, got ${deletedRouteResponse.status}`
		);
	}

	const deletedScan = await postScan({
		assignmentId: fixture.assignment.id,
		cookie,
		qrPayload
	});
	assert(
		deletedScan.httpStatus === 400,
		`Expected deleted scan 400, got ${deletedScan.httpStatus}`
	);

	const submittedBeforeDeletedManual = await pb.collection('submissions').getFirstListItem(
		pb.filter('submission_key = {:submissionKey}', {
			submissionKey: `${fixture.assignment.id}:${fixture.submittedStudent.id}`
		})
	);
	const deletedManual = await setStudentSubmissionStatus({
		assignmentId: fixture.assignment.id,
		studentId: fixture.submittedStudent.id,
		cookie,
		expectedStatus: 'submitted',
		expectedUpdatedAt: submittedBeforeDeletedManual.status_updated_at,
		targetStatus: 'missing'
	});
	assert(
		deletedManual.status === 400 || deletedManual.status === 404,
		`Expected deleted manual correction 400/404, got ${deletedManual.status}`
	);

	const restoreResponse = await restoreAssignment({
		assignmentId: fixture.assignment.id,
		cookie
	});
	assert(
		restoreResponse.status === 303,
		`Expected restore redirect 303, got ${restoreResponse.status}`
	);

	const restoredAssignment = await pb.collection('assignments').getOne(fixture.assignment.id);
	assert(restoredAssignment.status === 'closed', 'Expected restored assignment to remain closed');
	assert(!restoredAssignment.deleted_at, 'Expected restored deleted_at to be empty');
	assert(!restoredAssignment.deleted_by, 'Expected restored deleted_by to be empty');
	const repeatedRestore = await pb.send('/api/assignment-deletion-status', {
		method: 'POST',
		body: {
			assignmentId: fixture.assignment.id,
			action: 'restore'
		}
	});
	assert(repeatedRestore.status === 'unchanged', 'Expected repeated restore to be unchanged');

	const restoredDetail = await fetch(`${appUrl}/app/assignments/${fixture.assignment.id}`, {
		headers: { cookie }
	});
	assert(
		restoredDetail.status === 200,
		`Expected restored detail 200, got ${restoredDetail.status}`
	);

	const preservedSubmissions = await pb.collection('submissions').getList(1, 10, {
		filter: pb.filter('assignment = {:assignmentId}', { assignmentId: fixture.assignment.id })
	});
	const preservedEvents = await pb.collection('submission_status_events').getList(1, 20, {
		filter: pb.filter('assignment = {:assignmentId}', { assignmentId: fixture.assignment.id })
	});
	assert(preservedSubmissions.totalItems === 2, 'Soft delete changed submission records');
	assert(preservedEvents.totalItems === 4, 'Soft delete changed audit events');

	console.log(
		JSON.stringify(
			{
				ok: true,
				teacherId: fixture.teacher.id,
				classId: fixture.classRecord.id,
				assignmentId: fixture.assignment.id,
				submittedStudentId: fixture.submittedStudent.id,
				missingStudentId: fixture.missingStudent.id,
				checks: [
					'student-import',
					'direct-create-blocked',
					'scan-submitted',
					'scan-duplicate',
					'realtime-summary-event',
					'csv-export',
					'close-blocks-scan',
					'manual-revoke-while-closed',
					'manual-submit-while-closed',
					'reopen-reactivates-revoked-scan',
					'submission-audit-events',
					'status-icon-controls',
					'assignment-lifecycle-security',
					'assignment-lifecycle-idempotency',
					'assignment-soft-delete',
					'deleted-route-guards',
					'assignment-trash-list',
					'assignment-restore-closed',
					'soft-delete-preserves-history'
				]
			},
			null,
			2
		)
	);
};

try {
	await main();
} finally {
	stopAppServer();
}
