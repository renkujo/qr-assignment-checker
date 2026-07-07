# Sangha Review

Date: 2026-07-06

## Sareebut — Lead / Architect

Recommendation:

Build a thin vertical slice first:

```txt
login -> class/students -> QR card -> assignment -> scan -> realtime summary
```

Architecture direction:

- Keep `class_code` from the beginning even if MVP starts with one room.
- Use PocketBase auth for teacher login.
- Use `qr_token` instead of exposing student id or personal data in QR.
- Treat `assignment + student` as the submission identity.

## Ubali — Reviewer / Rules

Highest-risk rule:

Duplicate prevention must be enforced by backend/database unique constraint, not frontend debounce only.

Required guard:

```txt
submissions.submission_key unique
submission_key = assignmentId:studentId
```

Rules to protect:

- unauthenticated users cannot write submissions
- teacher can only manage own class/assignment
- QR token should be opaque and unique
- scanner must reject students outside the assignment class

Future hardening:

- move scan write into PocketBase hook/custom endpoint if collection rules become too weak for cross-record validation
- avoid exposing raw token records in public list/view APIs

## Anurut — QA / Observation

Must test on real devices early.

Critical QA points:

- mobile camera requires HTTPS except localhost
- iOS Safari and Android Chrome can behave differently
- scanner must pause/lock during request
- offline mode should not pretend success
- realtime summary must reconcile with backend data

Minimum real-device smoke:

1. HTTPS deploy/local tunnel
2. one iPhone + one Android
3. scan valid QR
4. scan duplicate QR
5. scan invalid QR
6. verify PocketBase records and summary count

## Synthesized decision

Start with docs + schema-first plan, then implement Phase 0/1.

Do not build scanner UI before PocketBase schema and duplicate guard are defined, because scan correctness depends on data constraints.
