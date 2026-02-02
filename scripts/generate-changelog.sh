
#!/bin/bash

# Simple Changelog Generator
# Usage: ./scripts/generate-changelog.sh [vPrevious] [vCurrent]

PREV_TAG=$1
CURR_TAG=$2

if [ -z "$PREV_TAG" ]; then
  echo "Usage: ./scripts/generate-changelog.sh <prev-tag> <curr-tag>"
  exit 1
fi

echo "## [$CURR_TAG] - $(date +%Y-%m-%d)"
echo "### Commits"
git log $PREV_TAG..HEAD --pretty=format:"- %s (%h)" --no-merges | grep -E "^- (feat|fix|docs|refactor):"
echo ""
