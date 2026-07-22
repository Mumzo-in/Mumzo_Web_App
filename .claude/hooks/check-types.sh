#!/usr/bin/env bash
# Stop-hook gate: the agent may not finish with type or lint errors.
#
# Fast path: if no .ts/.tsx file is dirty in an app, that app is skipped —
# a stop with no code changes costs nothing. On failure, exit 2 blocks the
# stop and feeds the errors back to the agent so it fixes them.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 0

fail=""

for app in admin platform; do
  # Only check apps with dirty TS sources (staged, unstaged, or untracked).
  if ! git status --porcelain "apps/$app" 2>/dev/null | grep -qE '\.tsx?$'; then
    continue
  fi

  out=$(cd "apps/$app" && bunx tsc --noEmit 2>&1)
  if [ -n "$out" ]; then
    fail+="tsc errors in apps/$app:
$(echo "$out" | head -20)
"
  fi
done

# Biome across whatever is dirty (cheap, so no gating).
biome_out=$(bunx biome check apps/admin apps/platform packages/catalog-model 2>&1)
if echo "$biome_out" | grep -qE "^Found [1-9][0-9]* error"; then
  fail+="biome errors:
$(echo "$biome_out" | grep -B2 "error" | head -20)
"
fi

if [ -n "$fail" ]; then
  # Exit 2 blocks the stop; stderr is fed back to the agent.
  echo "$fail" >&2
  exit 2
fi
exit 0
