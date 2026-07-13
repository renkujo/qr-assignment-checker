/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		const assignments = app.findCollectionByNameOrId('assignments');

		assignments.fields.add(
			new DateField({ name: 'deleted_at', required: false }),
			new RelationField({
				name: 'deleted_by',
				collectionId: users.id,
				required: false,
				maxSelect: 1
			})
		);
		assignments.addIndex('idx_assignments_deleted_at', false, 'deleted_at', '');
		assignments.updateRule =
			'class.teacher = @request.auth.id && deleted_at = "" && @request.body.class:changed = false && @request.body.created_by:changed = false && @request.body.deleted_at:changed = false && @request.body.deleted_by:changed = false';
		app.save(assignments);
	},
	(app) => {
		const assignments = app.findCollectionByNameOrId('assignments');
		assignments.removeIndex('idx_assignments_deleted_at');
		assignments.fields.removeByName('deleted_at');
		assignments.fields.removeByName('deleted_by');
		assignments.updateRule =
			'class.teacher = @request.auth.id && @request.body.class:changed = false && @request.body.created_by:changed = false';
		app.save(assignments);
	}
);
