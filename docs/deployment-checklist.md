# Deployment Checklist

## Before deploy

- [ ] GitHub repo is pushed.
- [ ] Web service uses `Dockerfile`.
- [ ] PocketBase service uses `Dockerfile.pocketbase`.
- [ ] PocketBase has a persistent volume mounted at `/pb/pb_data`.
- [ ] Web service has `ORIGIN`, `POCKETBASE_URL`, and `PUBLIC_POCKETBASE_URL` set.
- [ ] Both web and PocketBase have HTTPS domains.

## After PocketBase deploy

- [ ] Open `https://<pocketbase-domain>/_/`.
- [ ] Create superuser if prompted.
- [ ] Confirm migrations created required collections.
- [ ] Create at least one teacher in `users` collection.

## After web deploy

- [ ] `/` loads.
- [ ] `/login` loads.
- [ ] Teacher login works.
- [ ] `/app/students` loads.
- [ ] `/app/assignments` loads.

## Full product smoke

- [ ] Add student.
- [ ] Print QR page renders.
- [ ] Create assignment.
- [ ] Scan QR on real phone over HTTPS.
- [ ] Duplicate scan is blocked.
- [ ] Summary updates realtime.
- [ ] CSV export downloads.
- [ ] Close assignment blocks scan.
- [ ] Reopen assignment allows scan.
