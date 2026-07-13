/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		let submissions = app.findCollectionByNameOrId('submissions');
		submissions.fields.add(
			new SelectField({
				name: 'status',
				values: ['submitted', 'revoked'],
				required: false,
				maxSelect: 1
			}),
			new SelectField({
				name: 'status_source',
				values: ['camera', 'manual'],
				required: false,
				maxSelect: 1
			}),
			new RelationField({
				name: 'status_updated_by',
				collectionId: users.id,
				required: false,
				maxSelect: 1
			}),
			new DateField({ name: 'status_updated_at', required: false })
		);
		app.save(submissions);

		for (const submission of app.findAllRecords('submissions')) {
			const assignment = app.findRecordById('assignments', submission.getString('assignment'));
			const student = app.findRecordById('students', submission.getString('student'));
			const classRecord = app.findRecordById('classes', assignment.getString('class'));
			const expectedSubmissionKey = `${assignment.id}:${student.id}`;
			const submittedAt = submission.getString('submitted_at');
			const submittedBy = submission.getString('submitted_by');
			const scanSource = submission.getString('scan_source');

			if (
				student.getString('class') !== assignment.getString('class') ||
				submission.getString('submission_key') !== expectedSubmissionKey ||
				submission.getString('class_code') !== assignment.getString('class_code') ||
				assignment.getString('created_by') !== classRecord.getString('teacher') ||
				submittedBy !== classRecord.getString('teacher') ||
				!submittedAt ||
				!submittedBy ||
				(scanSource !== 'camera' && scanSource !== 'manual')
			) {
				throw new Error(`Invalid legacy submission: ${submission.id}`);
			}

			submission.set('status', 'submitted');
			submission.set('status_source', scanSource);
			submission.set('status_updated_by', submittedBy);
			submission.set('status_updated_at', submittedAt);
			app.save(submission);
		}

		submissions = app.findCollectionByNameOrId('submissions');
		submissions.fields.getByName('status').required = true;
		submissions.fields.getByName('status_source').required = true;
		submissions.fields.getByName('status_updated_by').required = true;
		submissions.fields.getByName('status_updated_at').required = true;
		submissions.addIndex('idx_submissions_status', false, 'status', '');
		app.save(submissions);

		const assignments = app.findCollectionByNameOrId('assignments');
		const students = app.findCollectionByNameOrId('students');
		const events = new Collection({
			type: 'base',
			name: 'submission_status_events',
			listRule: 'assignment.class.teacher = @request.auth.id',
			viewRule: 'assignment.class.teacher = @request.auth.id',
			createRule: null,
			updateRule: null,
			deleteRule: null
		});
		events.fields.add(
			new RelationField({
				name: 'submission',
				collectionId: submissions.id,
				required: true,
				maxSelect: 1
			}),
			new RelationField({
				name: 'assignment',
				collectionId: assignments.id,
				required: true,
				maxSelect: 1
			}),
			new RelationField({
				name: 'student',
				collectionId: students.id,
				required: true,
				maxSelect: 1
			}),
			new TextField({ name: 'submission_key', required: true, max: 120 }),
			new SelectField({
				name: 'from_status',
				values: ['submitted', 'revoked'],
				required: false,
				maxSelect: 1
			}),
			new SelectField({
				name: 'to_status',
				values: ['submitted', 'revoked'],
				required: true,
				maxSelect: 1
			}),
			new SelectField({
				name: 'source',
				values: ['camera', 'manual'],
				required: true,
				maxSelect: 1
			}),
			new RelationField({
				name: 'teacher',
				collectionId: users.id,
				required: true,
				maxSelect: 1
			}),
			new DateField({ name: 'changed_at', required: true })
		);
		events.addIndex('idx_submission_status_events_submission', false, 'submission', '');
		events.addIndex('idx_submission_status_events_assignment', false, 'assignment', '');
		events.addIndex('idx_submission_status_events_student', false, 'student', '');
		events.addIndex('idx_submission_status_events_teacher', false, 'teacher', '');
		events.addIndex('idx_submission_status_events_changed_at', false, 'changed_at', '');
		app.save(events);

		const classes = app.findCollectionByNameOrId('classes');
		classes.createRule = '@request.auth.id != "" && teacher = @request.auth.id';
		classes.updateRule = 'teacher = @request.auth.id && @request.body.teacher:changed = false';
		app.save(classes);

		students.createRule = 'class.teacher = @request.auth.id';
		students.updateRule = 'class.teacher = @request.auth.id && @request.body.class:changed = false';
		app.save(students);

		assignments.createRule = 'class.teacher = @request.auth.id && created_by = @request.auth.id';
		assignments.updateRule =
			'class.teacher = @request.auth.id && @request.body.class:changed = false && @request.body.created_by:changed = false';
		app.save(assignments);
	},
	(app) => {
		const events = app.findCollectionByNameOrId('submission_status_events');
		app.delete(events);

		const submissions = app.findCollectionByNameOrId('submissions');
		submissions.removeIndex('idx_submissions_status');
		submissions.fields.removeByName('status');
		submissions.fields.removeByName('status_source');
		submissions.fields.removeByName('status_updated_by');
		submissions.fields.removeByName('status_updated_at');
		app.save(submissions);

		const classes = app.findCollectionByNameOrId('classes');
		classes.createRule = '@request.auth.id != ""';
		classes.updateRule = 'teacher = @request.auth.id';
		app.save(classes);

		const students = app.findCollectionByNameOrId('students');
		students.createRule = '@request.auth.id != ""';
		students.updateRule = 'class.teacher = @request.auth.id';
		app.save(students);

		const assignments = app.findCollectionByNameOrId('assignments');
		assignments.createRule = '@request.auth.id != ""';
		assignments.updateRule = 'class.teacher = @request.auth.id';
		app.save(assignments);
	}
);
