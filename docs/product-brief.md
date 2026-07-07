# Product Brief — QR Assignment Checker

## Goal

ช่วยครูลดเวลาการเช็คส่งงานในห้องเรียน โดยใช้กล้องมือถือสแกน QR ประจำตัวนักเรียน แล้วบันทึกสถานะการส่งงานทันที

## Main users

- ครู: login, จัดการนักเรียน, สร้าง assignment, สแกน QR, ดูสรุปผล
- นักเรียน: ถือ/แสดง QR card ประจำตัว ไม่ต้อง login ใน MVP

## Core features

### 1. สแกนเช็คงาน

ครูเลือก assignment ที่ต้องการเช็ค แล้วเปิดกล้องมือถือเพื่อสแกน QR ของนักเรียนแต่ละคน ระบบบันทึก submission ทันที

### 2. กันสแกนซ้ำ

ถ้านักเรียนคนเดิมถูกสแกนซ้ำใน assignment เดิม ระบบต้องแจ้งว่า `ส่งแล้ว` แทนการสร้าง record ซ้ำ

สำคัญ: กันซ้ำที่ database ด้วย unique key ไม่ใช่กันแค่ frontend

### 3. จัดการนักเรียน

ครูเพิ่ม/แก้ไขรายชื่อนักเรียนในห้อง และพิมพ์ QR card ประจำตัวนักเรียนได้

### 4. จัดการ assignment

ครูสร้างรายการงานที่ต้องส่ง โดยผูกกับห้อง/วิชา ผ่าน `class_code`

### 5. สรุปผล realtime

ครูดูภาพรวมได้ทันที:

- ส่งแล้วกี่คน
- ยังไม่ส่งกี่คน
- รายชื่อนักเรียนที่ส่งแล้ว
- รายชื่อนักเรียนที่ยังไม่ส่ง

### 6. Export Excel/CSV

หลังจากสแกนและสรุปผลแล้ว ครูสามารถ export รายงานของ assignment นั้นเป็นไฟล์ที่ Excel เปิดได้

MVP เริ่มจาก CSV ก่อน เพราะง่าย เสถียร และเหมาะกับงานครูส่วนใหญ่

ข้อมูลในไฟล์ควรมีอย่างน้อย:

- เลขที่
- ชื่อ-นามสกุล
- สถานะ: `ส่งแล้ว` / `ยังไม่ส่ง`
- เวลาส่ง

ไฟล์ CSV ต้องรองรับภาษาไทย โดยใส่ UTF-8 BOM เพื่อให้ Excel เปิดแล้วไม่เพี้ยน

## MVP boundaries

In scope:

- ครู login
- ห้องเดียว/วิชาเดียวเริ่มต้น
- จัดการนักเรียนแบบ manual
- สร้าง assignment
- สแกน QR ผ่าน browser camera
- realtime summary
- export CSV ที่ Excel เปิดได้
- พิมพ์ QR card

Out of scope ชั่วคราว:

- นักเรียน login
- หลายโรงเรียน/หลายครูร่วมกัน
- offline queue sync
- import Excel/CSV ขั้นสูง
- analytics ระยะยาว
- export `.xlsx` จริงด้วย library เช่น SheetJS ถ้าผู้ใช้ต้องการหลัง MVP
- native mobile app

## Key product rule

Submission identity คือ:

```txt
assignment + student
```

หนึ่ง assignment ต่อหนึ่ง student มีได้แค่หนึ่ง submission เท่านั้น
