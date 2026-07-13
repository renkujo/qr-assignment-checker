# PocketBase Schema Contract

This document is the Phase 1 source of truth for PocketBase collections, indexes, and rule intent.

Goal: make scan correctness depend on PocketBase data constraints, not only frontend state.

## Auth collection

### `users`

Use PocketBase built-in auth collection for teachers.

Suggested extra fields:

| Field         | Type | Required | Notes                |
| ------------- | ---- | -------- | -------------------- |
| `name`        | text | no       | Teacher display name |
| `school_name` | text | no       | Optional school name |

Rule intent:

- Teachers can view/update their own profile.
- Admin can manage all users.

## App collections

### `classes`

Stores classroom/subject grouping. MVP starts with one class, but every record is class-scoped from the beginning.

| Field        | Type                | Required | Notes                                      |
| ------------ | ------------------- | -------- | ------------------------------------------ |
| `name`       | text                | yes      | Example: `ม.1/1`                           |
| `subject`    | text                | yes      | Example: `คณิตศาสตร์`                      |
| `class_code` | text                | yes      | Unique human/system code, e.g. `M1-1-MATH` |
| `teacher`    | relation -> `users` | yes      | Owner teacher                              |
| `active`     | bool                | yes      | Default true                               |

Indexes / constraints:

- unique `class_code`
- index `teacher`

Rule intent:

- Authenticated teacher can list/view only classes where `teacher = @request.auth.id`.
- Authenticated teacher can create a class with themselves as teacher.
- Authenticated teacher can update only own classes.
- Delete should be admin-only or disabled until product really needs it.

### `students`

Stores student roster and each student's opaque QR token.

| Field        | Type                  | Required | Notes                                     |
| ------------ | --------------------- | -------- | ----------------------------------------- |
| `class`      | relation -> `classes` | yes      | Student class                             |
| `class_code` | text                  | yes      | Snapshot/helper for fast filtering/export |
| `student_no` | text                  | yes      | เลขที่                                    |
| `full_name`  | text                  | yes      | ชื่อ-นามสกุล                              |
| `qr_token`   | text                  | yes      | Opaque unique token for QR payload        |
| `active`     | bool                  | yes      | Default true                              |

Indexes / constraints:

- unique `qr_token`
- unique composite target: `class + student_no`
- index `class`
- index `class_code`

QR payload:

```txt
student:<qr_token>
```

Rule intent:

- Authenticated teacher can list/view students only in own classes.
- Authenticated teacher can create/update students only in own classes.
- Do not expose list/view of raw student records publicly.
- `qr_token` must not be predictable and must not contain PII.

### `assignments`

Stores assignment/check session metadata.

| Field        | Type                  | Required | Notes                                       |
| ------------ | --------------------- | -------- | ------------------------------------------- |
| `class`      | relation -> `classes` | yes      | Assignment class                            |
| `class_code` | text                  | yes      | Snapshot/helper for filtering               |
| `subject`    | text                  | yes      | Can mirror class subject for export clarity |
| `title`      | text                  | yes      | Assignment title                            |
| `due_date`   | date                  | no       | Optional due date                           |
| `status`     | select                | yes      | `draft`, `active`, `closed`                 |
| `created_by` | relation -> `users`   | yes      | Teacher who created it                      |
| `deleted_at` | date                  | no       | Soft-delete timestamp                       |
| `deleted_by` | relation -> `users`   | no       | Teacher who moved it to trash               |

Indexes / constraints:

- index `class`
- index `class_code`
- index `status`
- index `created_by`
- index `deleted_at`

Rule intent:

- Authenticated teacher can list/view assignments in own classes.
- Authenticated teacher can create/update assignments in own classes.
- New submissions should be blocked when assignment status is not `active`.
- Deleted assignments are hidden from normal lists and blocked from summary, scan, export, and manual correction.
- Direct REST updates cannot write `deleted_at` or `deleted_by`; the server-owned lifecycle endpoint owns delete/restore.

### Assignment soft-delete contract

Authenticated teachers use `POST /api/assignment-deletion-status` with:

```txt
assignmentId + action(delete|restore)
```

Delete sets `status = closed`, `deleted_at`, and `deleted_by` in one transaction. Restore clears the
deletion fields but deliberately keeps `status = closed`, so scanner access never reopens
automatically. Submissions and `submission_status_events` are never removed. The normal assignment
list filters to `deleted_at = ""`; the trash view filters to `deleted_at != ""`.

### `submissions`

Stores the actual submitted status. This is the correctness boundary for duplicate prevention.

| Field            | Type                      | Required | Notes                               |
| ---------------- | ------------------------- | -------- | ----------------------------------- |
| `assignment`     | relation -> `assignments` | yes      | Assignment being checked            |
| `student`        | relation -> `students`    | yes      | Submitted student                   |
| `class_code`     | text                      | yes      | Snapshot/helper for summary/export  |
| `submitted_by`   | relation -> `users`       | yes      | Teacher/scanner                     |
| `submitted_at`   | date                      | yes      | Server/client submission timestamp  |
| `scan_source`    | select                    | yes      | `camera`, `manual`                  |
| `submission_key` | text                      | yes      | Unique `<assignmentId>:<studentId>` |
| `status`         | select                    | yes      | `submitted`, `revoked`              |

Indexes / constraints:

- unique `submission_key`
- index `assignment`
- index `student`
- index `class_code`
- index `submitted_by`
- index `status`

Rule intent:

- Direct REST create for `submissions` is disabled.
- Teachers create/update submission state through the server-owned scan/manual endpoints only.
- The custom endpoint validates that the assignment/class belongs to the authenticated teacher.
- Teacher can list/view submissions only in own classes.
- Direct REST update/delete remains disabled; `POST /api/manual-submission-status` owns corrections.
- Duplicate submission must resolve to `ส่งแล้ว`; the unique `submission_key` remains the final race-condition guard.

`submissions` is the current-state record. A revoked record remains in the collection so the same
`submission_key` can be reactivated by a later QR scan or teacher correction.

### `submission_status_events`

Append-only audit events for every real status transition.

| Field            | Type                      | Required | Notes                         |
| ---------------- | ------------------------- | -------- | ----------------------------- |
| `submission`     | relation -> `submissions` | yes      | Current-state record          |
| `assignment`     | relation -> `assignments` | yes      | Assignment snapshot relation  |
| `student`        | relation -> `students`    | yes      | Student snapshot relation     |
| `submission_key` | text                      | yes      | Stable assignment/student key |
| `from_status`    | select                    | no       | Empty for first submission    |
| `to_status`      | select                    | yes      | `submitted`, `revoked`        |
| `source`         | select                    | yes      | `camera`, `manual`            |
| `teacher`        | relation -> `users`       | yes      | Teacher who changed status    |
| `changed_at`     | date                      | yes      | Server transition timestamp   |

Rule intent:

- Teacher can list/view events only for their own audit trail.
- Direct create/update/delete is disabled; server hooks own all writes.

## Scan flow contract

When scanner reads QR:

1. SvelteKit scan route posts `assignmentId + qrPayload` to PocketBase `POST /api/scan-submissions`.
2. PocketBase parses `student:<qr_token>`.
3. PocketBase resolves `student` by `qr_token` and loads selected `assignment`.
4. PocketBase confirms assignment owner, class membership, active student state, and assignment status.
5. PocketBase creates `submission_key = assignmentId:studentId`.
6. PocketBase creates `submissions` server-side.
7. If a matching submission is already `submitted`, return duplicate/already-submitted state.
8. If a matching submission is `revoked`, reactivate the same record and preserve `submission_key`.
9. Append a `submission_status_events` record for every real transition.

## Teacher status correction contract

Authenticated teachers use `POST /api/manual-submission-status` with:

```txt
assignmentId + studentId + status(submitted|missing)
```

The endpoint validates assignment ownership, class membership, and active student state. It can run
while an assignment is closed because it is a teacher correction, not a student submission. Setting
`missing` revokes the existing submission without deleting it; setting `submitted` creates or
reactivates the stable record. Requests that already match the current state are no-ops and do not
append duplicate audit events.

Frontend debounce/scan lock is required for UX, but it is not the correctness guard.

## Realtime summary contract

Summary must be derived from authoritative data:

- full active student roster for the assignment class
- submissions filtered by assignment

Submitted/missing rows should be calculated from those two sets.

Realtime behavior:

- subscribe to `submissions` for the selected assignment
- on event, refresh or reconcile from backend data
- never increment final counts only from local scan events

## Export contract

CSV export uses the same authoritative summary rows.

Columns:

```txt
เลขที่,ชื่อ-นามสกุล,สถานะ,เวลาส่ง,วิธีบันทึก,อัปเดตสถานะล่าสุด
```

Rules:

- include every active student in the assignment class
- one row per student
- status is `ส่งแล้ว` or `ยังไม่ส่ง`
- missing students have empty submitted time
- file includes UTF-8 BOM so Thai text opens correctly in Excel

## Current migration note

The first code migration under `pocketbase/pb_migrations/` creates the collections and unique/index guards. It reuses PocketBase's default `users` auth collection and adds `school_name`.

The first migration creates the base collections and indexes. A follow-up migration locks direct `submissions` create by setting `submissions.createRule = null`; scan writes now go through `pocketbase/pb_hooks/main.pb.js` at `POST /api/scan-submissions`.

Migration `1783351000_add_submission_status_audit.js` adds current `submitted`/`revoked` state,
migrates existing records to `submitted`, and creates the append-only `submission_status_events`
collection. The same hook file owns both scan and manual status endpoints.

Migration `1783352000_add_assignment_soft_delete.js` adds server-owned `deleted_at`/`deleted_by`,
indexes trash filtering, and prevents direct REST lifecycle mutation. The lifecycle endpoint in
`pocketbase/pb_hooks/main.pb.js` owns delete and restore transitions.
