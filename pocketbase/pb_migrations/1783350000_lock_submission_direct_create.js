/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const submissions = app.findCollectionByNameOrId('submissions');
		submissions.createRule = null;
		app.save(submissions);
	},
	(app) => {
		const submissions = app.findCollectionByNameOrId('submissions');
		submissions.createRule = '@request.auth.id != ""';
		app.save(submissions);
	}
);
