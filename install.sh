#!/usr/bin/env bash
# Symlinks each skills/<name>/ into ~/.claude/skills/<name>/.
# Re-running is safe: existing symlinks pointing here are refreshed;
# real directories (non-symlinks) at the target are left alone with a warning.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$ROOT/skills"
DEST="$HOME/.claude/skills"

mkdir -p "$DEST"

for skill_path in "$SRC"/*/; do
  skill="$(basename "$skill_path")"
  target="$DEST/$skill"

  if [ -L "$target" ]; then
    # existing symlink — refresh it
    rm "$target"
  elif [ -e "$target" ]; then
    echo "skip: $target exists and is not a symlink (leaving it alone)" >&2
    continue
  fi

  ln -s "$skill_path" "$target"
  echo "linked: $target -> $skill_path"
done

echo
echo "Done. Skills are active in Claude Code; no restart needed."
