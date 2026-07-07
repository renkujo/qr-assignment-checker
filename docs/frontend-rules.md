# Frontend Rules

This project uses SvelteKit, so these rules adapt the portable parts of Renkujo frontend discipline without forcing React-specific patterns into the app.

## Source order

1. User instruction
2. Safety and secrets constraints
3. Repo-local reality: `AGENTS.md`, current SvelteKit/PocketBase code, package scripts
4. SvelteKit conventions
5. Renkujo/Mahiro fallback discipline
6. Generic framework knowledge

## Framework boundary

Current intended stack:

- SvelteKit PWA
- PocketBase SDK
- `html5-qrcode`
- pnpm

Do not introduce React Router, React Query, Zustand, BaseService, Next.js, Turborepo, Lingui, or a design-system package unless the repo earns that shape or Kiattisak explicitly asks.

## Route ownership

SvelteKit route files should keep page ownership visible:

```txt
src/routes/
  +layout.svelte
  +layout.server.ts
  +page.svelte
  students/+page.svelte
  assignments/[id]/+page.svelte
  scan/[assignmentId]/+page.svelte
```

Rules:

- route files own URL shape, load/action wiring, auth guards, and page outline
- do not hide a full page behind an opaque `Dashboard`/`Screen` wrapper
- extract repeated domain logic into `src/lib/<domain>/`
- route UI can compose small domain components only after repetition is real

## Domain ownership

Preferred source layout after scaffold:

```txt
src/lib/
  pocketbase/
    client.ts
    auth.ts
  qr/
    parse-qr-payload.ts
    create-qr-payload.ts
  submissions/
    create-submission-key.ts
    scan-submission.ts
    get-assignment-summary.ts
  students/
  assignments/
  classes/
  ui/
```

Rules:

- PocketBase setup lives under `src/lib/pocketbase/`
- QR parsing/creation lives under `src/lib/qr/`
- scan submission and duplicate handling live under `src/lib/submissions/`
- single-owner types/data stay near their domain; do not promote to global shared folders prematurely
- shared UI starts small and source-owned

## API and data boundary

PocketBase is the backend boundary.

Rules:

- do not create a second API abstraction style before PocketBase access patterns are established
- do not let scanner UI directly assemble trusted server fields without domain validation
- do not trust client-provided `student`, `assignment`, `submitted_by`, or status fields without backend/rules validation
- derive summary from authoritative PocketBase data, not client-only counters

Submission identity is fixed unless discussed:

```txt
submission_key = <assignmentId>:<studentId>
```

## State boundary

Initial rule:

- server/API data should come from SvelteKit load/actions or PocketBase queries/subscriptions
- client state should be local UI state: camera state, pending scan, latest result, selected device, transient errors
- do not introduce a global store for submission lists or summaries unless repeated cross-route client state appears

## Component and file style

- normal files use kebab-case
- SvelteKit route files use SvelteKit names: `+page.svelte`, `+page.server.ts`, `+layout.svelte`
- exported TypeScript interfaces should use `I...` when defining important object shapes
- prefer named exports in `.ts` modules
- comments should explain structure/intent, not narrate change history

## Styling and UI posture

- mobile-first teacher workflow
- scanner page must prioritize assignment context, camera viewport, latest scan result, and submitted/missing count
- avoid decorative dashboards before the data/scanner correctness is stable
- use semantic tokens/classes once styling is established

## Implementation gates

Before editing source code, state:

```md
Pre-edit Gate:

- Mode:
- Repo family:
- Rendering mode:
- Target owner:
- Files to create/change:
- Route/module boundary:
- API boundary:
- Data model boundary:
- State boundary:
- Styling/token boundary:
- i18n boundary:
- Exception needed:
```

Before handoff, verify:

```md
Post-edit Gate:

- Route/page outline still visible:
- New files placed by ownership:
- PocketBase boundary followed:
- API/server data kept out of global client store:
- Submission identity preserved:
- QR token safety preserved:
- Styling follows established local system:
- Verification run or risk stated:
```
