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

Indexes:

- index `class`
- index `class_code`
- index `status`

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
5. create submission
6. ถ้า unique conflict ให้ตอบกลับเป็น duplicate/already submitted

Frontend debounce ช่วย UX แต่ DB unique key คือ guard หลัก

## PocketBase access rule direction

MVP อาจเริ่มด้วย frontend SDK + collection rules ได้ แต่ scan action มีเงื่อนไขหลาย record จึงควรมี backend validation ที่ชัดเจนใน phase ถัดไป เช่น PocketBase hook/custom endpoint

Minimum rules:

- ครูต้อง login ก่อนเข้า app
- ครูเห็นเฉพาะ class/assignment/student/submission ของตัวเอง
- `submissions` create ต้องถูกจำกัด ไม่เปิดให้เขียน field สำคัญมั่ว ๆ
- student QR token ไม่ควรถูก list แบบ public
