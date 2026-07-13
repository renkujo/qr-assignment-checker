/// <reference path="../pb_data/types.d.ts" />

routerAdd(
	'POST',
	'/api/manual-submission-status',
	function (e) {
		function toText(value) {
			return value === undefined || value === null ? '' : String(value).trim();
		}

		function bad(message) {
			throw e.badRequestError(message, {});
		}

		function forbidden(message) {
			throw e.forbiddenError(message, {});
		}

		function conflict(message) {
			throw e.conflictError(message, {});
		}

		function requiredRecord(app, collectionName, id, fieldName) {
			if (!id) bad(`${fieldName} is required`);

			try {
				return app.findRecordById(collectionName, id);
			} catch (_) {
				bad(`${fieldName} is invalid`);
			}
		}

		function findSubmission(app, submissionKey) {
			try {
				return app.findFirstRecordByData('submissions', 'submission_key', submissionKey);
			} catch (_) {
				return null;
			}
		}

		function saveStatusEvent(app, submission, fromStatus, toStatus, source, teacherId, changedAt) {
			const collection = app.findCollectionByNameOrId('submission_status_events');
			const event = new Record(collection, {
				submission: submission.id,
				assignment: submission.getString('assignment'),
				student: submission.getString('student'),
				submission_key: submission.getString('submission_key'),
				from_status: fromStatus,
				to_status: toStatus,
				source,
				teacher: teacherId,
				changed_at: changedAt
			});

			app.save(event);
		}

		function validateAssignmentStudent(assignment, student) {
			if (!student.getBool('active')) bad('student is inactive');
			if (student.getString('class') !== assignment.getString('class')) {
				bad('student does not belong to the assignment class');
			}
		}

		const auth = e.auth;

		if (!auth || !auth.id) {
			throw e.unauthorizedError('Authentication is required', {});
		}

		const body = e.requestInfo().body || {};
		const assignmentId = toText(body.assignmentId);
		const studentId = toText(body.studentId);
		const requestedStatus = toText(body.status);
		const expectedStatus = toText(body.expectedStatus);
		const expectedUpdatedAt = toText(body.expectedUpdatedAt);

		if (!/^[a-z0-9]{15}$/.test(assignmentId) || !/^[a-z0-9]{15}$/.test(studentId)) {
			bad('assignment or student id is invalid');
		}

		if (requestedStatus !== 'submitted' && requestedStatus !== 'missing') {
			bad('status must be submitted or missing');
		}

		if (expectedStatus !== 'submitted' && expectedStatus !== 'missing') {
			bad('expectedStatus must be submitted or missing');
		}

		let result;

		$app.runInTransaction((txApp) => {
			const assignment = requiredRecord(txApp, 'assignments', assignmentId, 'assignment');
			const classRecord = requiredRecord(txApp, 'classes', assignment.getString('class'), 'class');

			if (classRecord.getString('teacher') !== auth.id) {
				forbidden('assignment does not belong to the current teacher');
			}

			if (assignment.getString('deleted_at')) {
				bad('assignment is deleted');
			}

			const student = requiredRecord(txApp, 'students', studentId, 'student');
			validateAssignmentStudent(assignment, student);

			const submissionKey = `${assignment.id}:${student.id}`;
			const targetStatus = requestedStatus === 'submitted' ? 'submitted' : 'revoked';
			let submission = findSubmission(txApp, submissionKey);
			const currentStatus = submission ? submission.getString('status') : '';
			const currentPublicStatus = currentStatus === 'submitted' ? 'submitted' : 'missing';
			const currentUpdatedAt = submission ? submission.getString('status_updated_at') : '';

			if (
				submission &&
				(submission.getString('assignment') !== assignment.id ||
					submission.getString('student') !== student.id ||
					submission.getString('class_code') !== assignment.getString('class_code'))
			) {
				bad('submission record is inconsistent');
			}

			if (
				(!submission && targetStatus === 'revoked') ||
				(submission && currentStatus === targetStatus)
			) {
				result = {
					status: 'unchanged',
					studentId: student.id,
					studentName: student.getString('full_name'),
					studentNo: student.getString('student_no'),
					targetStatus: requestedStatus,
					updatedAt: submission ? submission.getString('status_updated_at') : '',
					message: 'submission status is already up to date'
				};
				return;
			}

			if (currentPublicStatus !== expectedStatus || currentUpdatedAt !== expectedUpdatedAt) {
				conflict('สถานะมีการเปลี่ยนแปลงแล้ว กรุณาตรวจสอบอีกครั้ง');
			}

			const changedAt = new Date().toISOString();

			if (!submission) {
				const collection = txApp.findCollectionByNameOrId('submissions');
				submission = new Record(collection, {
					assignment: assignment.id,
					student: student.id,
					class_code: assignment.getString('class_code'),
					submitted_by: auth.id,
					submitted_at: changedAt,
					scan_source: 'manual',
					submission_key: submissionKey,
					status: 'submitted',
					status_source: 'manual',
					status_updated_by: auth.id,
					status_updated_at: changedAt
				});
				txApp.save(submission);
				saveStatusEvent(txApp, submission, '', 'submitted', 'manual', auth.id, changedAt);
			} else {
				submission.set('status', targetStatus);
				submission.set('status_source', 'manual');
				submission.set('status_updated_by', auth.id);
				submission.set('status_updated_at', changedAt);

				if (targetStatus === 'submitted') {
					submission.set('submitted_by', auth.id);
					submission.set('submitted_at', changedAt);
					submission.set('scan_source', 'manual');
				}

				txApp.save(submission);
				saveStatusEvent(
					txApp,
					submission,
					currentStatus,
					targetStatus,
					'manual',
					auth.id,
					changedAt
				);
			}

			result = {
				status: 'updated',
				studentId: student.id,
				studentName: student.getString('full_name'),
				studentNo: student.getString('student_no'),
				targetStatus: requestedStatus,
				updatedAt: changedAt,
				message: requestedStatus === 'submitted' ? 'บันทึกส่งงานแล้ว' : 'เปลี่ยนเป็นยังไม่ส่งแล้ว'
			};
		});

		return e.json(200, result);
	},
	$apis.requireAuth()
);

routerAdd(
	'POST',
	'/api/assignment-deletion-status',
	function (e) {
		function toText(value) {
			return value === undefined || value === null ? '' : String(value).trim();
		}

		function bad(message) {
			throw e.badRequestError(message, {});
		}

		function forbidden(message) {
			throw e.forbiddenError(message, {});
		}

		function requiredRecord(app, collectionName, id, fieldName) {
			if (!id) bad(`${fieldName} is required`);

			try {
				return app.findRecordById(collectionName, id);
			} catch (_) {
				bad(`${fieldName} is invalid`);
			}
		}

		const auth = e.auth;

		if (!auth || !auth.id) {
			throw e.unauthorizedError('Authentication is required', {});
		}

		const body = e.requestInfo().body || {};
		const assignmentId = toText(body.assignmentId);
		const action = toText(body.action);

		if (!/^[a-z0-9]{15}$/.test(assignmentId)) {
			bad('assignment id is invalid');
		}

		if (action !== 'delete' && action !== 'restore') {
			bad('action must be delete or restore');
		}

		let result;

		$app.runInTransaction((txApp) => {
			const assignment = requiredRecord(txApp, 'assignments', assignmentId, 'assignment');
			const classRecord = requiredRecord(txApp, 'classes', assignment.getString('class'), 'class');

			if (classRecord.getString('teacher') !== auth.id) {
				forbidden('assignment does not belong to the current teacher');
			}

			const deletedAt = assignment.getString('deleted_at');

			if ((action === 'delete' && deletedAt) || (action === 'restore' && !deletedAt)) {
				result = {
					status: 'unchanged',
					action,
					assignmentId: assignment.id,
					deletedAt,
					message: action === 'delete' ? 'ใบงานอยู่ในถังขยะแล้ว' : 'ใบงานถูกกู้คืนแล้ว'
				};
				return;
			}

			if (action === 'delete') {
				const changedAt = new Date().toISOString();
				assignment.set('status', 'closed');
				assignment.set('deleted_at', changedAt);
				assignment.set('deleted_by', auth.id);
				txApp.save(assignment);
				result = {
					status: 'updated',
					action,
					assignmentId: assignment.id,
					deletedAt: changedAt,
					message: 'ย้ายใบงานไปถังขยะแล้ว'
				};
				return;
			}

			assignment.set('status', 'closed');
			assignment.set('deleted_at', '');
			assignment.set('deleted_by', '');
			txApp.save(assignment);
			result = {
				status: 'updated',
				action,
				assignmentId: assignment.id,
				deletedAt: '',
				message: 'กู้คืนใบงานแล้ว ใบงานยังคงปิดรับอยู่'
			};
		});

		return e.json(200, result);
	},
	$apis.requireAuth()
);

routerAdd(
	'POST',
	'/api/scan-submissions',
	function (e) {
		function toText(value) {
			return value === undefined || value === null ? '' : String(value).trim();
		}

		function bad(message) {
			throw e.badRequestError(message, {});
		}

		function forbidden(message) {
			throw e.forbiddenError(message, {});
		}

		function requiredRecord(app, collectionName, id, fieldName) {
			if (!id) bad(`${fieldName} is required`);

			try {
				return app.findRecordById(collectionName, id);
			} catch (_) {
				bad(`${fieldName} is invalid`);
			}
		}

		function findSubmission(app, submissionKey) {
			try {
				return app.findFirstRecordByData('submissions', 'submission_key', submissionKey);
			} catch (_) {
				return null;
			}
		}

		function saveStatusEvent(app, submission, fromStatus, toStatus, source, teacherId, changedAt) {
			const collection = app.findCollectionByNameOrId('submission_status_events');
			const event = new Record(collection, {
				submission: submission.id,
				assignment: submission.getString('assignment'),
				student: submission.getString('student'),
				submission_key: submission.getString('submission_key'),
				from_status: fromStatus,
				to_status: toStatus,
				source,
				teacher: teacherId,
				changed_at: changedAt
			});

			app.save(event);
		}

		function validateAssignmentStudent(assignment, student) {
			if (!student.getBool('active')) bad('student is inactive');
			if (student.getString('class') !== assignment.getString('class')) {
				bad('student does not belong to the assignment class');
			}
		}

		const auth = e.auth;

		if (!auth || !auth.id) {
			throw e.unauthorizedError('Authentication is required', {});
		}

		const body = e.requestInfo().body || {};
		const assignmentId = toText(body.assignmentId);
		const qrPayload = toText(body.qrPayload);
		const qrToken = qrPayload.startsWith('student:')
			? qrPayload.slice('student:'.length).trim()
			: '';

		if (!/^[a-z0-9]{15}$/.test(assignmentId) || !qrToken || qrPayload.length > 200) {
			bad('QR payload is invalid');
		}

		let result;

		$app.runInTransaction((txApp) => {
			const assignment = requiredRecord(txApp, 'assignments', assignmentId, 'assignment');
			const classRecord = requiredRecord(txApp, 'classes', assignment.getString('class'), 'class');

			if (classRecord.getString('teacher') !== auth.id) {
				forbidden('assignment does not belong to the current teacher');
			}

			if (assignment.getString('deleted_at')) {
				bad('assignment is deleted');
			}

			if (assignment.getString('status') !== 'active') {
				bad(
					assignment.getString('status') === 'closed'
						? 'assignment is closed'
						: 'assignment is not active'
				);
			}

			let student;

			try {
				student = txApp.findFirstRecordByData('students', 'qr_token', qrToken);
			} catch (_) {
				bad('student QR token is invalid');
			}

			validateAssignmentStudent(assignment, student);

			const submissionKey = `${assignment.id}:${student.id}`;
			let submission = findSubmission(txApp, submissionKey);

			if (
				submission &&
				(submission.getString('assignment') !== assignment.id ||
					submission.getString('student') !== student.id ||
					submission.getString('class_code') !== assignment.getString('class_code'))
			) {
				bad('submission record is inconsistent');
			}

			if (submission && submission.getString('status') !== 'revoked') {
				result = {
					status: 'duplicate',
					studentName: student.getString('full_name'),
					studentNo: student.getString('student_no'),
					submittedAt: submission.getString('submitted_at'),
					message: 'นักเรียนคนนี้ส่งแล้ว'
				};
				return;
			}

			const submittedAt = new Date().toISOString();

			if (submission) {
				submission.set('status', 'submitted');
				submission.set('submitted_by', auth.id);
				submission.set('submitted_at', submittedAt);
				submission.set('scan_source', 'camera');
				submission.set('status_source', 'camera');
				submission.set('status_updated_by', auth.id);
				submission.set('status_updated_at', submittedAt);
				txApp.save(submission);
				saveStatusEvent(txApp, submission, 'revoked', 'submitted', 'camera', auth.id, submittedAt);
			} else {
				const collection = txApp.findCollectionByNameOrId('submissions');
				submission = new Record(collection, {
					assignment: assignment.id,
					student: student.id,
					class_code: assignment.getString('class_code'),
					submitted_by: auth.id,
					submitted_at: submittedAt,
					scan_source: 'camera',
					submission_key: submissionKey,
					status: 'submitted',
					status_source: 'camera',
					status_updated_by: auth.id,
					status_updated_at: submittedAt
				});
				txApp.save(submission);
				saveStatusEvent(txApp, submission, '', 'submitted', 'camera', auth.id, submittedAt);
			}

			result = {
				status: 'submitted',
				studentName: student.getString('full_name'),
				studentNo: student.getString('student_no'),
				submittedAt: submission.getString('submitted_at'),
				message: 'บันทึกส่งงานแล้ว'
			};
		});

		return e.json(200, result);
	},
	$apis.requireAuth()
);
