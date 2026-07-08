# Implementation Plan

## Phase 0 — Project foundation

Goal: เตรียม repo ให้พร้อมพัฒนาแบบไม่มั่ว

Tasks:

- scaffold SvelteKit app
- setup TypeScript, lint, format
- add PWA baseline
- add PocketBase SDK config
- add env example
- add local dev docs

Done when:

- app run ได้
- connect PocketBase ได้
- README มีคำสั่ง dev ชัดเจน

## Phase 1 — PocketBase schema

Goal: สร้าง DB shape ที่กันซ้ำและขยายได้

Schema contract:

- `docs/pocketbase-schema.md`
- `docs/pocketbase-local-setup.md`

Tasks:

- create collections: `classes`, `students`, `assignments`, `submissions`
- add indexes/unique fields
- add basic auth rules
- seed sample class + students + assignment

Done when:

- teacher login ได้
- sample data อ่านได้จาก SvelteKit
- duplicate `submission_key` ถูก block ที่ DB

## Phase 1.5 — Auth foundation

Goal: ครู login ผ่าน PocketBase แล้วเข้า protected workspace ได้

Tasks:

- server-side PocketBase cookie auth boundary
- `/login` route with SvelteKit form action
- protected `/app` route
- logout action

Done when:

- unauthenticated `/app` redirects to `/login`
- teacher login creates PocketBase auth cookie
- logout clears auth cookie

## Phase 2 — Student roster + QR cards

Goal: ครูจัดการรายชื่อนักเรียนและพิมพ์ QR ได้

Student roster slice status:

- `/app/students` lists active students for the teacher default class
- first visit auto-creates a default class for the logged-in teacher if none exists
- create action adds student number, full name, opaque `qr_token`, and QR payload preview
- paste import supports CSV/TSV rows from Excel or Google Sheets, creates new students only, skips invalid rows, skips duplicate student numbers, and preserves existing QR tokens
- print QR cards route exists at `/app/students/print`

Routes:

- `/app/students`
- `/app/students/print`

Tasks:

- student list
- create/edit student
- generate `qr_token`
- render printable QR cards

Done when:

- เพิ่มนักเรียนได้
- QR card แสดง payload `student:<qr_token>`
- QR scan test อ่าน token ได้

## Phase 3 — Assignment + summary

Goal: สร้าง assignment และดูสถานะส่ง/ยังไม่ส่ง

Assignment slice status:

- `/app/assignments` lists and creates assignments for the teacher default class
- `/app/assignments/[assignmentId]` shows submitted/missing summary from roster + submissions
- scanner route is still pending

Routes:

- `/app/assignments`
- `/app/assignments/[assignmentId]`

Tasks:

- assignment CRUD ขั้นต้น
- summary query: submitted/missing
- subscribe realtime `submissions`

Done when:

- สร้าง assignment ได้
- summary ถูกต้องหลัง refresh
- realtime update เมื่อมี submission ใหม่

## Phase 4 — Scanner flow

Goal: ครูสแกน QR แล้วระบบบันทึกทันทีแบบปลอดภัย

Scanner slice status:

- `/app/assignments/[assignmentId]/scan` opens a browser camera scanner with `html5-qrcode`
- scanner locks/stops while submitting to avoid rapid duplicate writes
- SvelteKit POST endpoint forwards `assignmentId + qrPayload` to PocketBase `POST /api/scan-submissions`
- PocketBase validates QR payload, assignment owner/status, student activity, and class membership before creating submission
- duplicate submissions return `ส่งแล้ว` instead of creating another record
- direct REST create for `submissions` is blocked by collection rule, leaving the custom endpoint as the write path
- assignment summary can close/open receiving work; closed assignments block scans with Thai copy

Route:

- `/scan/[assignmentId]`

Tasks:

- integrate `html5-qrcode`
- request camera permission
- parse QR payload
- debounce/lock while submitting
- create submission with `submission_key`
- show states: success, duplicate, invalid QR, wrong class, offline/error

Done when:

- valid QR creates submission
- duplicate QR does not create duplicate
- wrong/unknown QR gives clear error
- slow network does not create double submit

## Phase 5 — Mobile/PWA polish

Goal: ใช้บนมือถือจริงได้ดี

Tasks:

- HTTPS deployment note
- installable PWA basics
- mobile-first scanner UI
- vibration/sound feedback optional
- camera permission recovery copy
- CSV export summary from assignment detail

Done when:

- tested on iPhone Safari and Android Chrome
- scanner works over HTTPS
- summary remains accurate

## Implementation posture — Mahiro-style fallback

ใช้ Mahiro-style เป็นรูปทรง fallback สำหรับ repo ใหม่ แต่ repo reality และ SvelteKit conventions ต้องมาก่อน

Code shape ที่ต้องการ:

- route files รับผิดชอบ URL/load/action/page composition
- domain logic แยกเป็นโมดูลเล็กใน `src/lib/<domain>/`
- PocketBase client อยู่ใน `src/lib/pocketbase/`
- QR parsing อยู่ใน `src/lib/qr/`
- submission creation/duplicate handling อยู่ใน `src/lib/submissions/`
- shared UI ค่อย extract เมื่อ reuse จริง ไม่สร้าง component layer เกินจำเป็น

Naming/style:

- normal files ใช้ kebab-case
- SvelteKit route files ใช้ convention ของ SvelteKit
- exported TypeScript interfaces ใช้ `I...` เมื่อเป็น shape สำคัญ
- helper/action names ต้องอ่านเป็น domain action เช่น `resolveQrToken`, `createSubmissionKey`, `getAssignmentSummary`

Review gate ก่อนจบแต่ละ phase:

- ไม่เปลี่ยน submission identity
- ไม่ให้ frontend debounce เป็น guard หลัก
- ไม่ใส่ PII/raw student id ใน QR
- validation command ผ่านตาม script จริงของ repo
- สำหรับ MVP flow หลัก ให้รัน `pnpm smoke:mvp` เมื่อ PocketBase เปิดอยู่
