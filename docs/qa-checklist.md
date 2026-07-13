# QA Checklist

## Mobile camera

- scanner opens on HTTPS URL
- iPhone Safari can open rear camera
- Android Chrome can open rear camera
- deny permission shows recovery message
- no camera shows safe error
- non-HTTPS remote URL shows HTTPS-required message

## Scan behavior

- valid QR creates one submission
- same QR scanned repeatedly creates only one submission
- duplicate scan shows already submitted state
- invalid QR creates no submission
- QR from another class is rejected
- scanner locks while request is pending

## Network behavior

- offline before scan shows offline/retry state
- slow request keeps pending state
- timeout/error does not show false success
- retry after error is safe

## Realtime summary

- dashboard open before scan updates automatically
- dashboard opened after scan shows correct initial count
- duplicate scan does not increment count
- refresh matches realtime count
- reconnect after screen lock/network loss works or offers manual refresh

## Export CSV / Excel

- export file opens in Excel with Thai text readable
- file includes every student in the assignment class
- status matches submitted/missing summary
- duplicate scan does not duplicate a row
- missing students show empty submitted time

## PocketBase data checks

- `submissions.submission_key` is unique
- teacher cannot see another teacher's class data
- student QR token cannot expose private student data
- assignment closed state blocks new submissions

## MVP acceptance

Release MVP only when:

- login works
- roster works
- QR cards print/render
- Teacher can change a student from missing to submitted after confirmation.
- Teacher can change a student from submitted to missing after danger confirmation.
- Teacher status correction works while the assignment is closed without reopening scanner access.
- Revoked student can scan again after the assignment is reopened and the same submission record is reactivated.
- Summary/realtime/CSV reflect manual status corrections and audit source.
- Submission controls show explicit X/check icons plus text; current state is not communicated by color alone.
- Delete confirmation shows assignment title and submitted/total count.
- Soft-deleted assignment disappears from the normal list and appears in trash.
- Deleted assignment blocks summary, scanner, export, and manual status correction.
- Restoring an assignment preserves submissions/audit events and returns it as closed.
- assignment create works
- scanner works on real mobile browser over HTTPS
- duplicate prevention works at DB level
- realtime summary is accurate
