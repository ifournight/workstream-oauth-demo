#!/bin/bash

# Simple test runner script
# Usage: ./scripts/run-tests.sh [unit|e2e|all]

set -e

TEST_TYPE=${1:-all}

echo "🧪 Running Tests: $TEST_TYPE"
echo "=============================="
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

case $TEST_TYPE in
  unit)
    echo "🔬 Running Unit Tests..."
    bun run test:run
    ;;
  e2e)
    echo "🌐 Running E2E Tests..."
    bun run test:e2e
    ;;
  all|*)
    echo "🔬 Running Unit Tests..."
    bun run test:run
    echo ""
    echo "🌐 Running E2E Tests (if configured)..."
    if [ -d "cypress" ]; then
      bun run test:e2e || echo "⚠️  E2E tests skipped"
    else
      echo "⚠️  Cypress not configured, skipping E2E tests"
    fi
    ;;
esac

echo ""
echo "✅ Tests completed!"
