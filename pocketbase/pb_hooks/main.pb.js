/// <reference path="../pb_data/types.d.ts" />

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

		function requiredRecord(collectionName, id, fieldName) {
			if (!id) {
				bad(`${fieldName} is required`);
			}

			try {
				return $app.findRecordById(collectionName, id);
			} catch (_) {
				bad(`${fieldName} is invalid`);
			}
		}

		function existingSubmission(submissionKey) {
			try {
				return $app.findFirstRecordByData('submissions', 'submission_key', submissionKey);
			} catch (_) {
				return null;
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

		if (!qrToken) {
			bad('QR payload is invalid');
		}

		const assignment = requiredRecord('assignments', assignmentId, 'assignment');

		if (assignment.getString('created_by') !== auth.id) {
			bad('assignment does not belong to the current teacher');
		}

		if (assignment.getString('status') === 'closed') {
			bad('assignment is closed');
		}

		let student;

		try {
			student = $app.findFirstRecordByData('students', 'qr_token', qrToken);
		} catch (_) {
			bad('student QR token is invalid');
		}

		if (!student.getBool('active')) {
			bad('student is inactive');
		}

		if (student.getString('class') !== assignment.getString('class')) {
			bad('student does not belong to the assignment class');
		}

		const submissionKey = `${assignment.id}:${student.id}`;
		const foundSubmission = existingSubmission(submissionKey);

		if (foundSubmission) {
			return e.json(200, {
				status: 'duplicate',
				studentName: student.getString('full_name'),
				studentNo: student.getString('student_no'),
				submittedAt: foundSubmission.getString('submitted_at'),
				message: 'นักเรียนคนนี้ส่งแล้ว'
			});
		}

		const collection = $app.findCollectionByNameOrId('submissions');
		const submittedAt = new Date().toISOString();
		const submission = new Record(collection, {
			assignment: assignment.id,
			student: student.id,
			class_code: assignment.getString('class_code'),
			submitted_by: auth.id,
			submitted_at: submittedAt,
			scan_source: 'camera',
			submission_key: submissionKey
		});

		$app.save(submission);

		return e.json(200, {
			status: 'submitted',
			studentName: student.getString('full_name'),
			studentNo: student.getString('student_no'),
			submittedAt: submission.getString('submitted_at'),
			message: 'บันทึกส่งงานแล้ว'
		});
	},
	$apis.requireAuth()
);
