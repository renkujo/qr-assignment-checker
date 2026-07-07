# Agent Rules — QR Assignment Checker

## Current reality

This repo is a new MVP for a teacher QR assignment submission checker.

Stack direction:

- SvelteKit PWA frontend
- `html5-qrcode` for mobile browser camera scanning
- PocketBase for auth, DB, realtime, and admin UI
- pnpm as package manager

Product direction:

- One class / one subject first
- Data model must still support multiple classes via `class_code`
- QR payload must be opaque, e.g. `student:<qr_token>`
- Duplicate scan prevention must be enforced by database/backend constraints

## Working rules

- Read `README.md` and `docs/` before implementation.
- Keep changes scoped to the current phase.
- Do not change the core submission identity without discussion:

```txt
submission_key = <assignmentId>:<studentId>
```

- Frontend debounce is UX only. The correctness boundary is PocketBase unique/index/rules or backend hook validation.
- Do not expose student PII or raw predictable IDs inside QR codes.
- Do not claim mobile scanner readiness without real HTTPS/mobile-device testing.

## Mahiro-style preferred direction

Use this as fallback when repo-local code has not established a pattern yet.

### Project shape

Prefer clear ownership over broad generic folders:

```txt
src/
  lib/
    pocketbase/
    qr/
    submissions/
    students/
    assignments/
    classes/
  routes/
```

Guidance:

- Route files own URL, load/action wiring, and page-level composition.
- Domain logic belongs in small focused modules under `src/lib/<domain>/`.
- Shared UI should start source-owned and small; extract only after real reuse.
- Avoid large catch-all utility files.

### Naming

- Use kebab-case for normal `.ts` files and Svelte component files where practical.
- Svelte route files follow SvelteKit conventions (`+page.svelte`, `+page.server.ts`, etc.).
- Use clear domain names: `create-submission`, `resolve-qr-token`, `get-assignment-summary`.
- For TypeScript interfaces in `.ts` modules, prefer `I...` names when defining exported object shapes.

### Code boundaries

- Keep PocketBase client setup isolated under `src/lib/pocketbase/`.
- Keep QR parsing/validation isolated under `src/lib/qr/`.
- Keep scan submission creation isolated from UI components.
- Do not let scanner UI directly assemble trusted fields without a domain helper validating them.

### UI posture

- Teacher UI should be mobile-first, fast, and low-reading.
- Scanner page prioritizes current assignment, camera viewport, latest result, and submitted/missing count.
- Avoid decorative dashboard noise until core scan flow is correct.

## Validation expectation

For code changes, run the repo's actual scripts once established. Expected baseline after scaffold:

```bash
pnpm check
pnpm lint
pnpm build
```

For scanner/realtime work, add manual or Playwright-style acceptance notes from `docs/qa-checklist.md`.

## Renkujo frontend discipline

Use `docs/frontend-rules.md` as the repo-local adaptation of Renkujo frontend rules. Important constraint: this project is SvelteKit, not React/Next/React Router. Apply Renkujo's portable ownership rules, but do not force React-specific tools or folder shapes.

Portable Renkujo rules that apply here:

- keep route/page ownership visible
- place code by owner, not by generic buckets
- keep PocketBase access behind the established project boundary
- keep server/API data out of global client stores unless a real cross-route client-state need appears
- use kebab-case normal files and clear domain action names
- complete pre-edit/post-edit gates for implementation slices
