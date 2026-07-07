/// <reference path="../pb_data/types.d.ts" />

const createTextField = (name, required = true, options = {}) => {
	return new TextField({
		name,
		required,
		...options
	});
};

const createRelationField = (name, collectionId, required = true) => {
	return new RelationField({
		name,
		collectionId,
		required,
		maxSelect: 1
	});
};

const createSelectField = (name, values, required = true) => {
	return new SelectField({
		name,
		values,
		required,
		maxSelect: 1
	});
};

const saveCollection = (app, collection) => {
	app.save(collection);
	return app.findCollectionByNameOrId(collection.name);
};

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.add(createTextField('school_name', false, { max: 200 }));
		app.save(users);

		const classesDraft = new Collection({
			type: 'base',
			name: 'classes',
			listRule: 'teacher = @request.auth.id',
			viewRule: 'teacher = @request.auth.id',
			createRule: '@request.auth.id != ""',
			updateRule: 'teacher = @request.auth.id',
			deleteRule: null
		});
		classesDraft.fields.add(
			createTextField('name', true, { max: 160, presentable: true }),
			createTextField('subject', true, { max: 160 }),
			createTextField('class_code', true, { max: 80 }),
			createRelationField('teacher', users.id),
			new BoolField({ name: 'active' })
		);
		const classes = saveCollection(app, classesDraft);
		classes.addIndex('idx_classes_class_code_unique', true, 'class_code', '');
		classes.addIndex('idx_classes_teacher', false, 'teacher', '');
		app.save(classes);

		const studentsDraft = new Collection({
			type: 'base',
			name: 'students',
			listRule: 'class.teacher = @request.auth.id',
			viewRule: 'class.teacher = @request.auth.id',
			createRule: '@request.auth.id != ""',
			updateRule: 'class.teacher = @request.auth.id',
			deleteRule: null
		});
		studentsDraft.fields.add(
			createRelationField('class', classes.id),
			createTextField('class_code', true, { max: 80 }),
			createTextField('student_no', true, { max: 40 }),
			createTextField('full_name', true, { max: 240, presentable: true }),
			createTextField('qr_token', true, { max: 120 }),
			new BoolField({ name: 'active' })
		);
		const students = saveCollection(app, studentsDraft);
		students.addIndex('idx_students_qr_token_unique', true, 'qr_token', '');
		students.addIndex('idx_students_class_student_no_unique', true, 'class, student_no', '');
		students.addIndex('idx_students_class', false, 'class', '');
		students.addIndex('idx_students_class_code', false, 'class_code', '');
		app.save(students);

		const assignmentsDraft = new Collection({
			type: 'base',
			name: 'assignments',
			listRule: 'class.teacher = @request.auth.id',
			viewRule: 'class.teacher = @request.auth.id',
			createRule: '@request.auth.id != ""',
			updateRule: 'class.teacher = @request.auth.id',
			deleteRule: null
		});
		assignmentsDraft.fields.add(
			createRelationField('class', classes.id),
			createTextField('class_code', true, { max: 80 }),
			createTextField('subject', true, { max: 160 }),
			createTextField('title', true, { max: 240, presentable: true }),
			new DateField({ name: 'due_date' }),
			createSelectField('status', ['draft', 'active', 'closed']),
			createRelationField('created_by', users.id)
		);
		const assignments = saveCollection(app, assignmentsDraft);
		assignments.addIndex('idx_assignments_class', false, 'class', '');
		assignments.addIndex('idx_assignments_class_code', false, 'class_code', '');
		assignments.addIndex('idx_assignments_status', false, 'status', '');
		assignments.addIndex('idx_assignments_created_by', false, 'created_by', '');
		app.save(assignments);

		const submissionsDraft = new Collection({
			type: 'base',
			name: 'submissions',
			listRule: 'assignment.class.teacher = @request.auth.id',
			viewRule: 'assignment.class.teacher = @request.auth.id',
			createRule: '@request.auth.id != ""',
			updateRule: null,
			deleteRule: null
		});
		submissionsDraft.fields.add(
			createRelationField('assignment', assignments.id),
			createRelationField('student', students.id),
			createTextField('class_code', true, { max: 80 }),
			createRelationField('submitted_by', users.id),
			new DateField({ name: 'submitted_at' }),
			createSelectField('scan_source', ['camera', 'manual']),
			createTextField('submission_key', true, { max: 120 })
		);
		const submissions = saveCollection(app, submissionsDraft);
		submissions.addIndex('idx_submissions_submission_key_unique', true, 'submission_key', '');
		submissions.addIndex('idx_submissions_assignment', false, 'assignment', '');
		submissions.addIndex('idx_submissions_student', false, 'student', '');
		submissions.addIndex('idx_submissions_class_code', false, 'class_code', '');
		submissions.addIndex('idx_submissions_submitted_by', false, 'submitted_by', '');
		app.save(submissions);
	},
	(app) => {
		for (const name of ['submissions', 'assignments', 'students', 'classes']) {
			try {
				const collection = app.findCollectionByNameOrId(name);
				app.delete(collection);
			} catch (_) {
				// Collection already missing; keep rollback idempotent for local dev.
			}
		}

		try {
			const users = app.findCollectionByNameOrId('users');
			users.fields.removeByName('school_name');
			app.save(users);
		} catch (_) {
			// Local rollback only.
		}
	}
);
