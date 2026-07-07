# QR Assignment Checker

ระบบเช็คการส่งงานด้วย QR Code สำหรับครู

MVP แรก: ครูเลือก assignment แล้วสแกน QR นักเรียนผ่านมือถือ ระบบบันทึกทันทีว่าใครส่งแล้ว กันสแกนซ้ำ และสรุปผลแบบ realtime

## Stack

- Frontend: SvelteKit + PWA
- QR scanner: `html5-qrcode`
- Backend / DB / Auth / Realtime: PocketBase
- Auth: PocketBase built-in auth สำหรับครู

## MVP scope

เริ่มจากห้องเดียว/วิชาเดียวก่อน แต่ data model รองรับหลายห้องผ่าน `class_code`

## Docs

- [`docs/pocketbase-local-setup.md`](docs/pocketbase-local-setup.md)
- [`docs/pocketbase-schema.md`](docs/pocketbase-schema.md)
- [`docs/frontend-rules.md`](docs/frontend-rules.md)
- [`docs/product-brief.md`](docs/product-brief.md)
- [`docs/data-model.md`](docs/data-model.md)
- [`docs/implementation-plan.md`](docs/implementation-plan.md)
- [`docs/qa-checklist.md`](docs/qa-checklist.md)
- [`docs/sangha-review.md`](docs/sangha-review.md)

## Development

```bash
pnpm install
pnpm dev
```

## Mobile camera testing

Browser camera access requires a secure context. `localhost` works on the same machine, but a phone cannot use your computer's `127.0.0.1`.

Recommended local mobile flow:

```bash
# Terminal 1
pnpm pb:serve

# Terminal 2
pnpm dev

# Terminal 3, using any HTTPS tunnel tool you have installed
cloudflared tunnel --url http://127.0.0.1:5173
# or
ngrok http 5173
```

Open the HTTPS tunnel URL on the phone, login, then visit `/app/assignments/[assignmentId]/scan`. The scanner page will show a clear warning if the current URL/browser cannot request camera permission.

Common checks after scaffold:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

MVP smoke after PocketBase is running:

```bash
pnpm smoke:mvp
```

This creates disposable local test records in `pocketbase/pb_data` and verifies direct submission writes are blocked, scan submit/duplicate works, summary realtime receives change events, CSV export works, and close/reopen assignment behavior is enforced.

Copy `.env.example` to `.env` and set `POCKETBASE_URL` / `PUBLIC_POCKETBASE_URL` when PocketBase is running.

## PocketBase local readiness

Check whether PocketBase is installed:

```bash
./scripts/check-pocketbase.sh
```

Run schema migrations:

```bash
pnpm pb:migrate
```

Start local PocketBase:

```bash
pnpm pb:serve
```

Then open the Admin UI at `http://127.0.0.1:8090/_/`.

## Current app routes

- `/login` — teacher login through PocketBase `users` auth collection
- `/app` — protected teacher workspace
- `/app/students` — student roster and QR payload preview
- `/app/students/print` — printable QR cards
- `/app/assignments` — assignment list and create form
- `/app/assignments/[assignmentId]` — live submitted/missing summary, close/reopen assignment, CSV export link
- `/app/assignments/[assignmentId]/export` — CSV export for Excel
- `/app/assignments/[assignmentId]/scan` — mobile QR scanner page
