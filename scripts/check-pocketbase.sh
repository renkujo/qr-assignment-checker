#!/bin/sh
set -eu

if command -v pocketbase >/dev/null 2>&1; then
  echo "PocketBase binary found: $(command -v pocketbase)"
  pocketbase --version || true
  exit 0
fi

cat <<'MSG'
PocketBase binary not found.

Install options:

1) Homebrew, if formula is available on this machine:
   brew install pocketbase

2) Official binary:
   https://pocketbase.io/docs/

After installing, run:
   pocketbase serve --http=127.0.0.1:8090

Then open:
   http://127.0.0.1:8090/_/
MSG

exit 1
