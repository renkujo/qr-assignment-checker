# Data Model

Backend ใช้ PocketBase collections

## Collections

### users

PocketBase built-in auth collection สำหรับครู

Fields เพิ่มเติมถ้าต้องการ:

- `name`
- `school_name`

### classes

เก็บข้อมูลห้อง/วิชา

Fields:

- `name` text — ชื่อห้อง เช่น `ม.1/1`
- `subject` text — ชื่อวิชา เช่น `คณิตศาสตร์`
- `class_code` text unique — code สำหรับผูกข้อมูลในระบบ
- `teacher` relation -> users
- `active` bool

Indexes:

- unique `class_code`
- index `teacher`

### students

รายชื่อนักเรียน

Fields:

- `class` relation -> classes
- `class_code` text
- `student_no` text
- `full_name` text
- `qr_token` text unique
- `active` bool

Indexes:

- unique `qr_token`
- unique-ish/composite `class + student_no`
- index `class_code`

QR payload แนะนำ:

```txt
student:<qr_token>
```

ไม่ควรใส่ student id หรือข้อมูลส่วนตัวตรง ๆ ใน QR

### assignments

งานที่ครูต้องการเช็คการส่ง

Fields:

- `class` relation -> classes
- `class_code` text
- `subject` text
- `title` text
- `due_date` date optional
- `status` select: `draft`, `active`, `closed`
- `created_by` relation -> users
- `deleted_at` date optional
- `deleted_by` relation -> users optional

Indexes:

- index `class`
- index `class_code`
- index `status`
- index `deleted_at`

การลบ assignment เป็น soft delete เท่านั้น:

- delete: ตั้ง `status = closed` พร้อม `deleted_at` และ `deleted_by`
- restore: ล้าง deletion fields แต่คง `status = closed`
- ไม่ลบ submissions หรือ audit events
- assignment ที่ถูกลบต้องเข้า summary, scan, export และ manual correction ไม่ได้

### submissions

ผลการส่งงาน

Fields:

- `assignment` relation -> assignments
- `student` relation -> students
- `class_code` text
- `submitted_by` relation -> users
- `submitted_at` date
- `scan_source` select: `camera`, `manual`
- `submission_key` text unique
- `status` select: `submitted`, `revoked`

`submission_key` format:

```txt
<assignmentId>:<studentId>
```

Indexes:

- unique `submission_key`
- index `assignment`
- index `student`
- index `class_code`

## Duplicate scan rule

เมื่อสแกน QR:

1. parse payload ได้ `qr_token`
2. หา student จาก `qr_token`
3. ตรวจว่า student อยู่ class เดียวกับ assignment
4. สร้าง `submission_key = assignmentId:studentId`
5. create submission หรือ reactivate record เดิมที่เป็น `revoked`
6. ถ้า record เดิมยังเป็น `submitted` ให้ตอบกลับเป็น duplicate/already submitted

Frontend debounce ช่วย UX แต่ DB unique key คือ guard หลัก

เมื่อครูเปลี่ยนเป็น `ยังไม่ได้ส่ง` ห้ามลบ submission record ให้เปลี่ยน `status` เป็น `revoked`
เพื่อเก็บ `submission_key` เดิมไว้ หากนักเรียนสแกน QR ใหม่ให้ reactivate record เดิมกลับเป็น
`submitted`

### submission_status_events

audit log แบบ append-only สำหรับทุก status transition

- `submission` relation -> submissions
- `assignment` relation -> assignments
- `student` relation -> students
- `submission_key` text
- `from_status` select optional: `submitted`, `revoked`
- `to_status` select: `submitted`, `revoked`
- `source` select: `camera`, `manual`
- `teacher` relation -> users
- `changed_at` date

ครูสามารถปรับสถานะได้แม้งานปิดรับ เพราะเป็น teacher correction และไม่เปิด scanner ให้นักเรียน

## PocketBase access rule direction

MVP อาจเริ่มด้วย frontend SDK + collection rules ได้ แต่ scan action มีเงื่อนไขหลาย record จึงควรมี backend validation ที่ชัดเจนใน phase ถัดไป เช่น PocketBase hook/custom endpoint

Minimum rules:

- ครูต้อง login ก่อนเข้า app
- ครูเห็นเฉพาะ class/assignment/student/submission ของตัวเอง
- `submissions` create ต้องถูกจำกัด ไม่เปิดให้เขียน field สำคัญมั่ว ๆ
- student QR token ไม่ควรถูก list แบบ public
