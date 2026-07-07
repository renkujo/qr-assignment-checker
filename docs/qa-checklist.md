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
- assignment create works
- scanner works on real mobile browser over HTTPS
- duplicate prevention works at DB level
- realtime summary is accurate
