#!/usr/bin/env bash
set -euo pipefail

ART_DIR="artifacts"
LOG_FILE="$ART_DIR/auto-test.log"
JSON_FILE="$ART_DIR/auto-test.json"

mkdir -p "$ART_DIR"
>"$LOG_FILE"

TARGET_DIR=${1:-practices/practice_03/lab/demo}

if [ ! -d "$TARGET_DIR" ]; then
  echo "[runner] Directory not found: $TARGET_DIR" | tee -a "$LOG_FILE"
  echo "{\"ok\":false,\"error\":\"directory not found\",\"dir\":\"$TARGET_DIR\"}" >"$JSON_FILE"
  exit 0
fi

echo "[runner] Running tests in $TARGET_DIR" | tee -a "$LOG_FILE"

summary=""
set +e
(
  cd "$TARGET_DIR" && make test
) >>"$LOG_FILE" 2>&1
code=$?
set -e

if [ $code -eq 0 ]; then
  summary="Tests passed in $TARGET_DIR"
  echo "{\"ok\":true,\"summary\":\"$summary\",\"logPath\":\"$LOG_FILE\"}" >"$JSON_FILE"
  echo "[runner] $summary" | tee -a "$LOG_FILE"
else
  summary="Tests failed in $TARGET_DIR (exit $code)"
  echo "{\"ok\":false,\"summary\":\"$summary\",\"logPath\":\"$LOG_FILE\"}" >"$JSON_FILE"
  echo "[runner] $summary" | tee -a "$LOG_FILE"
fi

echo "$summary"
