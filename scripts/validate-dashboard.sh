#!/usr/bin/env bash
# validate-dashboard.sh
# Validates all dashboard JSON files against their Zod schemas.
# Run before committing any changes to public/data/*.json
# Usage: ./scripts/validate-dashboard.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🛡️  Aegis Dashboard — JSON Validation"
echo "======================================="
echo ""

cd "$PROJECT_DIR"

# Check for ts-node or npx availability
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Run: npm install"
    exit 1
fi

# Run validation via ts-node
node scripts/validate-dashboard.cjs

echo ""
echo "======================================="
echo "✅ All dashboard files validated cleanly."
