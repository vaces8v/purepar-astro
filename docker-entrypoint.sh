#!/bin/sh
set -e

mkdir -p /data

if [ -n "${DATABASE_URL:-}" ]; then
  npx --no-install prisma db push
fi

exec "$@"
