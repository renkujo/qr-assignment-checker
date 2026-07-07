# PocketBase Workspace

This folder is reserved for PocketBase setup assets once the local binary/schema path is confirmed.

Current Phase 1 contract lives in:

- `docs/pocketbase-schema.md`
- `docs/pocketbase-local-setup.md`

Do not build scanner UI until the local PocketBase schema has the required unique guards:

- `classes.class_code`
- `students.qr_token`
- `submissions.submission_key`

For now, verify local readiness with:

```bash
./scripts/check-pocketbase.sh
```

Run migrations:

```bash
pnpm pb:migrate
```

Then run PocketBase:

```bash
pnpm pb:serve
```
