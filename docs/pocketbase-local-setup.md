# PocketBase Local Setup

This is the local development checklist for Phase 1.

## 0. Check local binary

```bash
./scripts/check-pocketbase.sh
```

If the script reports `PocketBase binary not found`, install PocketBase before trying to create collections.

## 1. Install / run PocketBase

Use the official PocketBase binary for macOS, then run it from a local development folder.

Run migrations first:

```bash
pnpm pb:migrate
```

Then start PocketBase:

```bash
pnpm pb:serve
```

Admin UI:

```txt
http://127.0.0.1:8090/_/
```

App env:

```bash
cp .env.example .env
```

Default local value:

```txt
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

## 2. Create collections

Create collections according to `docs/pocketbase-schema.md`:

1. `users` auth collection extra fields
2. `classes`
3. `students`
4. `assignments`
5. `submissions`

## 3. Required unique constraints

Do not continue scanner implementation until these are configured:

- `classes.class_code` unique
- `students.qr_token` unique
- `submissions.submission_key` unique

Recommended additional unique/index target:

- `students.class + students.student_no`

## 4. Seed local data

Minimum local seed for scanner development:

- one teacher user
- one class with `class_code`
- three students with unique `qr_token`
- one active assignment

Example QR payloads:

```txt
student:test-student-001
student:test-student-002
student:test-student-003
```

## 5. Manual guard test

Before building scanner UI:

1. Create submission for assignment A + student 1.
2. Try creating the same `submission_key` again.
3. PocketBase must reject the duplicate.

If duplicate creation succeeds, the schema is not ready.

## 6. Future migration note

For the first MVP, manual Admin UI setup is acceptable if documented.

When the schema stabilizes, move it into PocketBase migrations under a dedicated schema/migration folder so a new machine can recreate it without manual clicks.

## Migration status

Local validation on PocketBase `0.39.5` passed:

- migration created `classes`, `students`, `assignments`, and `submissions`
- existing default `users` auth collection is reused
- `users.school_name` field is added
- duplicate `submissions.submission_key` insert fails with SQLite unique constraint
- follow-up migration locks direct `submissions` create (`createRule = null`)
- PocketBase custom endpoint `POST /api/scan-submissions` owns scan creation and duplicate handling

Important implementation note:

- the first migration keeps app collection creation simple because PocketBase 0.39 validates new-collection rules before some cross-record expressions can be safely used in that migration path
- the scanner no longer writes directly to `submissions`; SvelteKit calls the PocketBase custom endpoint
- PocketBase/Goja did not reliably expose top-level helper declarations after bundling hooks to `pb.js`, so endpoint helper functions currently live inside the route handler

## Teacher user for login flow

The app now has a server-side SvelteKit login route at `/login` and a protected workspace at `/app`.

For local manual testing:

1. Run `pnpm pb:serve`.
2. Open `http://127.0.0.1:8090/_/`.
3. Create a superuser if PocketBase asks for one.
4. In the `users` auth collection, create one teacher user with email/password.
5. Open the SvelteKit app and login at `/login`.

Do not commit real teacher credentials into this repo.

## Student roster smoke

After creating a teacher user and logging in:

1. Open `/app/students`.
2. The app should auto-create `ห้องเริ่มต้น` for that teacher if no class exists.
3. Add a student with `เลขที่` and `ชื่อ-นามสกุล`.
4. The list should show a QR payload shaped like `student:<qr_token>`.
5. Adding the same student number again in the same class should fail because of `students.class + students.student_no` unique index.

## QR print smoke

After adding students:

1. Open `/app/students/print`.
2. Each active student should render one QR card.
3. The card QR image should encode `student:<qr_token>`.
4. Browser print preview should hide the toolbar and show printable cards.

## Assignment summary smoke

After logging in and adding students:

1. Open `/app/assignments`.
2. Create an assignment title.
3. Open the assignment row.
4. Summary should show all active students as `ยังไม่ส่ง` until scanner/submissions exist.
5. Submitted/missing counts should equal roster/submission data after refresh.

## Scanner smoke

After logging in, adding students, and creating an assignment:

1. Open `/app/assignments/[assignmentId]/scan` from the assignment summary.
2. Browser should ask for camera permission on HTTPS/localhost.
3. Scan a QR shaped like `student:<qr_token>`.
4. First scan should return `บันทึกส่งงานแล้ว`.
5. Scanning the same QR again should return `นักเรียนคนนี้ส่งแล้ว`.
6. Assignment summary should show the student as `ส่งแล้ว` after refresh.
7. Click `ปิดรับงาน`; scanning should be blocked and show `assignment นี้ปิดรับแล้ว`.
8. Click `เปิดรับใหม่`; scanning should work again.

Important: current scanner submission is validated by PocketBase `POST /api/scan-submissions`. Direct REST create for `submissions` is blocked, so direct API writes cannot bypass cross-record validation.

### Mobile camera note

The browser can request camera permission only from a secure context:

- same-machine `localhost` works
- phone opening `http://<computer-lan-ip>:5173` usually cannot open camera
- phone testing should use an HTTPS tunnel to the SvelteKit dev server, for example `cloudflared tunnel --url http://127.0.0.1:5173` or `ngrok http 5173`

Open the tunnel URL on the phone, login, then open `/app/assignments/[assignmentId]/scan`. If the URL/browser is not camera-ready, the scanner page shows a warning instead of failing silently.

## CSV export smoke

After an assignment has at least one submitted and one missing student:

1. Open `/app/assignments/[assignmentId]`.
2. Click `Export CSV`.
3. The downloaded CSV should include a UTF-8 BOM so Thai text opens correctly in Excel.
4. The header should be `เลขที่,ชื่อ-นามสกุล,สถานะ,เวลาส่ง`.
5. Submitted rows should show `ส่งแล้ว` and a submitted time.
6. Missing rows should show `ยังไม่ส่ง` and an empty submitted time.

## Automated MVP smoke

After PocketBase is running on `127.0.0.1:8090`, run:

```bash
pnpm smoke:mvp
```

The script starts the SvelteKit dev server on `127.0.0.1:5187` when needed, creates disposable local test records, and verifies:

- direct REST create for `submissions` returns 403
- first scan returns `submitted`
- repeated scan returns `duplicate`
- assignment summary realtime endpoint emits a change event after scan
- CSV export returns Thai-readable UTF-8 BOM CSV
- closing assignment blocks scan with Thai copy
- reopening assignment allows the route again without creating a duplicate

## Latest authenticated smoke result

Local authenticated smoke passed after the scanner slice:

1. Disposable teacher user created in local ignored `pocketbase/pb_data`.
2. Login through `/login` reached `/app`.
3. `/app/students` created a student and rendered `student:<qr_token>` payload.
4. `/app/assignments` created an assignment.
5. Assignment summary showed the student as `ยังไม่ส่ง` before scan.
6. POST `/app/assignments/[assignmentId]/scan/submit` returned `submitted`.
7. Repeating the same POST returned `duplicate`.
8. Assignment summary showed `ส่งแล้ว` after refresh.
9. CSV export route returned 200 with Thai-readable UTF-8 BOM CSV, one submitted row, one missing row, and exactly the summary statuses.
10. Assignment status action smoke passed: close returned 303 and blocked scan, reopen returned 303 and allowed scan again.

PocketBase 0.39 implementation notes learned during this smoke:

- `hidden: true` fields cannot be written through the normal auth API path, so `students.qr_token` is not marked hidden in the migration. Keep the collection protected by auth/rules instead.
- Custom collections created by this migration do not include an automatic `created` field, so assignment listing must not sort by `-created` unless that field is explicitly added later.
