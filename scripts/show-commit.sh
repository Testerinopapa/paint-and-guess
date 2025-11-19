#!/bin/bash
# Bash script to show git commit details

if [ -z "$1" ]; then
  echo "Usage: ./show-commit.sh <commit-hash> [--stat] [--no-patch] [--fuller]"
  exit 1
fi

COMMIT_HASH="$1"
shift  # Remove first argument, rest are git options

git show "$COMMIT_HASH" "$@"

