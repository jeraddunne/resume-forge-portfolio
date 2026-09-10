#!/usr/bin/env bash
#
# scan-secrets.sh — fail if anything key-shaped is tracked in this repository.
#
# This project is bring-your-own-key: no credential should ever be committed.
# Run before every push, and in review of any AI-generated change.
#
#   bash scripts/scan-secrets.sh
#
# Exits 0 when clean, 1 when something needs a human look.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

FOUND=0

scan() {
  local label="$1" pattern="$2"
  local hits
  # Only tracked files: node_modules and ignored paths are not our problem.
  hits=$(git grep -nIE "$pattern" -- . ':(exclude)scripts/scan-secrets.sh' 2>/dev/null)
  if [ -n "$hits" ]; then
    echo "!! $label"
    echo "$hits" | sed 's/^/     /'
    echo
    FOUND=1
  fi
}

echo "Scanning tracked files for credentials..."
echo

scan "Anthropic key"          'sk-ant-[A-Za-z0-9_-]{12,}'
scan "OpenAI-style key"       'sk-[A-Za-z0-9]{32,}'
scan "Bearer token literal"   'Bearer[[:space:]]+[A-Za-z0-9._-]{24,}'
scan "Assigned API key var"   '(ANTHROPIC|OPENAI|TOOLKIT)_API_KEY[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9_-]{8,}'
scan "AWS access key id"      'AKIA[0-9A-Z]{16}'
scan "Private key block"      'BEGIN[[:space:]]+(RSA|OPENSSH|EC|PGP)[[:space:]]+PRIVATE[[:space:]]+KEY'

# Files that should never be tracked at all, regardless of content.
BANNED=$(git ls-files | grep -iE '(^|/)(\.env|auth\.json|credentials\.json|secrets\.json|.*\.pem|.*\.p12|.*\.pfx)$' || true)
if [ -n "$BANNED" ]; then
  echo "!! Files that must never be committed:"
  echo "$BANNED" | sed 's/^/     /'
  echo
  FOUND=1
fi

if [ "$FOUND" -eq 0 ]; then
  echo "Clean: no credentials found in tracked files."
  exit 0
fi

echo "Secret scan FAILED. Remove the finding, then rewrite history if it was ever pushed."
exit 1
