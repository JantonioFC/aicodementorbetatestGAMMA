#!/usr/bin/env bash
#
# TDD New Feature — Bootstrap a test file and start watch mode
#
# Usage:
#   npm run tdd -- myFeature
#   bash scripts/tdd-new-feature.sh myFeature
#

set -euo pipefail

FEATURE="${1:-}"

if [ -z "$FEATURE" ]; then
  echo ""
  echo "Usage: npm run tdd -- <feature-name>"
  echo ""
  echo "Example: npm run tdd -- userProfile"
  echo ""
  exit 1
fi

TEST_DIR="tests/unit"
TEST_FILE="${TEST_DIR}/${FEATURE}.test.js"

# Ensure directory exists
mkdir -p "$TEST_DIR"

if [ -f "$TEST_FILE" ]; then
  echo ""
  echo "Test file already exists: $TEST_FILE"
  echo "Starting watch mode..."
  echo ""
else
  cat > "$TEST_FILE" <<EOF
/**
 * TDD: ${FEATURE}
 *
 * Red-Green-Refactor workflow:
 *   1. RED    — Write a failing test that describes the desired behavior
 *   2. GREEN  — Write the minimum code to make the test pass
 *   3. REFACTOR — Improve the code while keeping tests green
 *
 * Generated: $(date -Iseconds)
 */

describe('${FEATURE}', () => {
  it.todo('should [describe expected behavior]');

  // --- RED phase: uncomment and fill in ---
  // it('should do something', () => {
  //   // Arrange
  //   // Act
  //   // Assert
  //   expect(true).toBe(false); // Intentional fail — make it pass!
  // });
});
EOF

  echo ""
  echo "Created: $TEST_FILE"
fi

echo "───────────────────────────────────────────────────"
echo "  TDD Workflow — ${FEATURE}"
echo "───────────────────────────────────────────────────"
echo ""
echo "  1. RED    — Write a failing test"
echo "  2. GREEN  — Make it pass with minimal code"
echo "  3. REFACTOR — Clean up, then repeat"
echo ""
echo "  Starting Jest in watch mode..."
echo "  Press 'q' to quit watch mode."
echo ""

npx jest --watch --testPathPattern="${FEATURE}"
