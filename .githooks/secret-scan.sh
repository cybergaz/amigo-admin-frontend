#!/usr/bin/env bash
# =============================================================================
# Secret scan: stops keys, passwords and tokens from being committed or pushed.
# =============================================================================
# Used by .githooks/pre-commit (--staged), .githooks/pre-push (--range) and the
# test suite / a manual full check (--tree). The same file lives in amigo-app,
# amigo-backend and amigo-admin-frontend; keep the copies identical.
#
#   .githooks/secret-scan.sh --staged          lines added in the index
#   .githooks/secret-scan.sh --range <revs>    lines added by each commit in <revs>
#                                              (any `git log` revision args)
#   .githooks/secret-scan.sh --tree            every tracked file as it is now
#
# Prints "file:line: kind" (never the matched text) and exits 1 on any hit.
# Secrets belong in env files outside git (see deploy/prod.env.example in the
# backend). A line that only holds a placeholder can opt out with the marker
#   secret-scan: allow
# and whole paths (vendored test fixtures) via .githooks/secret-scan.allow
# (one extended regex per line, matched against the path).
# Hooks are enabled per clone with:  git config core.hooksPath .githooks
# Emergency bypass (never for real secrets): git commit/push --no-verify
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2

mode="${1:-}"
shift || true

CONTENT=(
  'PEM private key|-----BEGIN [A-Z ]*PRIVATE KEY-----'
  'base64 PEM block|LS0tLS1''CRUdJTi'   # split so this file does not match itself
  'service-account JSON|"type"[[:space:]]*:[[:space:]]*"service_account"'
  'AWS access key id|AKIA[0-9A-Z]{16}'
  'JWT|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
  "URL with password|[a-zA-Z][a-zA-Z0-9+.-]*://[^/[:space:]:@\"'\`]+:[^/[:space:]:@\"'\`\$<{]{6,}@"
  "secret assignment|^[[:space:]]*(export[[:space:]]+)?[A-Z0-9_]*(SECRET|PASSWORD|PASSWD|PEPPER|PRIVATE_KEY|API_KEY|ACCESS_KEY|AUTH_TOKEN)[A-Z0-9_]*[[:space:]]*=[[:space:]]*[\"']?[^\"'[:space:]#\$<{][^\"'[:space:]#]{7,}"
)
# Values that are obviously placeholders, not secrets (secret assignment only).
PLACEHOLDER='=[[:space:]]*["'"'"']?(your|example|changeme|change_me|xxx|placeholder|dummy|test-|<|\$\{)'
# Files that must never be tracked at all, whatever they contain.
BAD_PATH='(^|/)(\.env(\.[^/]*)?|key\.properties|servicekey[^/]*\.json|[^/]*adminsdk[^/]*\.json|[^/]*service-?account[^/]*\.json|AuthKey_[^/]*)$|\.(p8|p12|pfx|jks|keystore|mobileprovision)$'
OK_PATH='(^|/)\.env(\.[A-Za-z0-9_-]+)?\.example$'

ALLOW_RE=""
if [[ -f .githooks/secret-scan.allow ]]; then
  ALLOW_RE="$(grep -vE '^[[:space:]]*(#|$)' .githooks/secret-scan.allow | paste -sd'|' -)"
fi
allowed_path() { [[ -n "$ALLOW_RE" ]] && grep -qE "$ALLOW_RE" <<<"$1"; }

hits=0
report() { echo "secret-scan: $1"; hits=$((hits + 1)); }

# Added lines as "<label>\t<file>\t<line>\t<text>" from a -U0 patch on stdin.
# "commit <sha>" lines (from git log --format) become the label.
added_lines() {
  awk -v label="${1:-staged}" '
    /^commit [0-9a-f]{40}$/ { label = substr($2, 1, 8); next }
    /^\+\+\+ / { f = substr($0, 5); sub(/^b\//, "", f); next }
    /^@@ / { split($3, a, ","); n = substr(a[1], 2) + 0; next }
    /^\+/ { if (f != "/dev/null") print label "\t" f "\t" n "\t" substr($0, 2); n++; next }
  '
}

# One grep per pattern over all added lines (a push can add tens of thousands
# of lines); only the few hits are looked at one by one.
scan_stream() {
  local tmp entry kind re idx rec label file line text
  tmp="$(mktemp)"
  cat >"$tmp"
  for entry in "${CONTENT[@]}"; do
    kind="${entry%%|*}"; re="${entry#*|}"
    while IFS= read -r idx; do
      rec="$(sed -n "${idx}p" "$tmp")"
      IFS=$'\t' read -r label file line text <<<"$rec"
      allowed_path "$file" && continue
      [[ "$text" == *"secret-scan: allow"* ]] && continue
      if [[ "$kind" == "secret assignment" ]] && grep -qiE -- "$PLACEHOLDER" <<<"$text"; then continue; fi
      report "$label $file:$line: $kind"
    done < <(cut -f4- "$tmp" | grep -nE -- "$re" | cut -d: -f1)
  done
  rm -f "$tmp"
}

scan_paths() {
  local label="$1" p
  while IFS= read -r p; do
    [[ -z "$p" ]] && continue
    allowed_path "$p" && continue
    grep -qE -- "$OK_PATH" <<<"$p" && continue
    report "$label $p: secret-bearing file must not be tracked"
  done < <(grep -E -- "$BAD_PATH")
}

case "$mode" in
  --staged)
    # Process substitution, not pipes: the hit counter must survive.
    scan_stream < <(git diff --cached -U0 --no-color --no-ext-diff --diff-filter=ACMR | added_lines staged)
    scan_paths staged < <(git diff --cached --name-only --diff-filter=ACR)
    ;;
  --range)
    [[ $# -gt 0 ]] || { echo "usage: $0 --range <revs>"; exit 2; }
    # shellcheck disable=SC2068
    scan_stream < <(git log -p -U0 --no-color --no-ext-diff --diff-filter=ACMR --format='commit %H' $@ | added_lines range)
    # shellcheck disable=SC2068
    scan_paths range < <(git log --name-only --diff-filter=ACR --format= $@ | sort -u)
    ;;
  --tree)
    for entry in "${CONTENT[@]}"; do
      kind="${entry%%|*}"; re="${entry#*|}"
      while IFS= read -r m; do
        file="${m%%:*}"; rest="${m#*:}"; line="${rest%%:*}"; text="${rest#*:}"
        allowed_path "$file" && continue
        [[ "$text" == *"secret-scan: allow"* ]] && continue
        if [[ "$kind" == "secret assignment" ]] && grep -qiE -- "$PLACEHOLDER" <<<"$text"; then continue; fi
        report "tree $file:$line: $kind"
      done < <(git grep -nIE -e "$re" 2>/dev/null)
    done
    scan_paths tree < <(git ls-files)
    ;;
  *)
    echo "usage: $0 --staged | --range <revs> | --tree"; exit 2 ;;
esac

if (( hits > 0 )); then
  echo "secret-scan: $hits finding(s). Move secrets to env files outside git (see deploy/prod.env.example in amigo-backend);"
  echo "secret-scan: mark a pure placeholder line with 'secret-scan: allow'. Nothing was printed from the matched text."
  exit 1
fi
exit 0
