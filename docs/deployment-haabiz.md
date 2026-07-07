# Haabiz Sandbox Deployment

This app should be deployed as two services because PocketBase needs a persistent data volume and its own HTTP endpoint.

- `qr-assignment-web` — SvelteKit Node server
- `qr-assignment-pocketbase` — PocketBase with migrations/hooks and persistent `pb_data`

The GitHub repository is:

```txt
git@github.com:renkujo/qr-assignment-checker.git
```

## Architecture

```txt
Browser
  ├─ https://<web-domain>                 -> SvelteKit web service, port 3000
  └─ https://<pocketbase-domain>          -> PocketBase Admin/API/realtime, port 8090

SvelteKit web service
  └─ POCKETBASE_URL=http://<pocketbase-service-name>:8090
```

If the Haabiz dashboard does not provide internal service DNS, set `POCKETBASE_URL` to the public PocketBase HTTPS URL instead.

## Service 1 — PocketBase

Create a service from the same repository.

Suggested service name:

```txt
qr-assignment-pocketbase
```

Build settings:

```txt
Dockerfile path: Dockerfile.pocketbase
Port: 8090
Health path: /api/health
```

Environment variables:

```txt
PB_VERSION=0.39.5
```

Persistent volume:

```txt
Mount path: /pb/pb_data
Purpose: PocketBase SQLite database, uploaded files, auth records, app data
```

Do not mount or persist over these paths; they come from the repository image:

```txt
/pb/pb_migrations
/pb/pb_hooks
```

The PocketBase container command runs migrations before serving:

```txt
pocketbase migrate up ... && pocketbase serve ...
```

## Service 2 — Web

Create a second service from the same repository.

Suggested service name:

```txt
qr-assignment-web
```

Build settings:

```txt
Dockerfile path: Dockerfile
Port: 3000
```

Environment variables:

```txt
HOST=0.0.0.0
PORT=3000
ORIGIN=https://<web-domain>
POCKETBASE_URL=http://qr-assignment-pocketbase:8090
PUBLIC_POCKETBASE_URL=https://<pocketbase-domain>
```

If `qr-assignment-pocketbase` is not resolvable from the web container, use:

```txt
POCKETBASE_URL=https://<pocketbase-domain>
```

## Domain plan

Use two HTTPS domains or subdomains.

Example:

```txt
https://qr-assignment-checker.cnx-sandbox.haabiz.com      -> web:3000
https://qr-assignment-pb.cnx-sandbox.haabiz.com           -> pocketbase:8090
```

Camera scanning on mobile requires HTTPS. Plain HTTP or LAN IP usually cannot open the camera.

## First production setup

After PocketBase is deployed and reachable:

1. Open PocketBase Admin UI:

```txt
https://<pocketbase-domain>/_/
```

2. Create the PocketBase superuser if prompted.
3. Confirm collections exist after migrations:
   - `users`
   - `classes`
   - `students`
   - `assignments`
   - `submissions`
4. Create a teacher account in the `users` collection.

Important: the PocketBase superuser account is for admin UI only. The app login uses `users` collection records.

## Production smoke checklist

Use a real phone for the scanner step.

1. Open `https://<web-domain>/login`.
2. Login with a teacher from the `users` collection.
3. Open `รายชื่อนักเรียน`.
4. Add at least two students.
5. Open `พิมพ์ QR ทั้งห้อง` and confirm QR cards render.
6. Create an assignment from `งานที่ต้องตรวจ`.
7. Open the assignment detail page.
8. Click `เริ่มสแกน` on a real phone over HTTPS.
9. Scan a student QR.
10. Confirm the summary updates realtime.
11. Scan the same QR again and confirm it returns duplicate, not a second submission.
12. Download CSV and confirm Thai text opens correctly.
13. Close assignment and confirm scanning is blocked.
14. Reopen assignment and confirm scanning works again.

## Backup rule

Back up the PocketBase volume regularly:

```txt
/pb/pb_data
```

This folder is the production database and uploaded file state. Losing it loses app data.

## Current known constraints

- No in-app teacher registration screen yet; create teacher users in PocketBase Admin UI.
- PocketBase must remain available for login, actions, summary, realtime, and CSV export.
- Mobile camera testing must be done on HTTPS with a real device.
