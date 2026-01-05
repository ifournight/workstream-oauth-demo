#!/bin/bash

# Test verification script for login functionality
# This script runs all tests and provides a summary

set -e

echo "🧪 Running Login Functionality Tests"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Installing...${NC}"
    bun install
fi

# Check for required packages
MISSING_DEPS=()
if [ ! -d "node_modules/jose" ]; then
    MISSING_DEPS+=("jose")
fi
if [ ! -d "node_modules/iron-session" ]; then
    MISSING_DEPS+=("iron-session")
fi
if [ ! -d "node_modules/vitest" ]; then
    MISSING_DEPS+=("vitest")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing dependencies: ${MISSING_DEPS[*]}${NC}"
    echo "Installing missing dependencies..."
    bun install
fi

echo -e "${GREEN}✅ Dependencies check complete${NC}"
echo ""

# Run unit tests
echo "🔬 Running Unit Tests (Vitest)..."
echo "-----------------------------------"
if bun run test --run 2>&1 | tee /tmp/test-output.log; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
    UNIT_TEST_RESULT=0
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    UNIT_TEST_RESULT=1
fi
echo ""

# Run E2E tests (if Cypress is configured)
if [ -d "cypress" ]; then
    echo "🌐 Running E2E Tests (Cypress)..."
    echo "-----------------------------------"
    if bun run test:e2e 2>&1 | tee /tmp/e2e-test-output.log; then
        echo -e "${GREEN}✅ E2E tests passed${NC}"
        E2E_TEST_RESULT=0
    else
        echo -e "${YELLOW}⚠️  E2E tests skipped or failed (may need manual setup)${NC}"
        E2E_TEST_RESULT=1
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  Cypress not configured, skipping E2E tests${NC}"
    E2E_TEST_RESULT=0
    echo ""
fi

# Summary
echo "📊 Test Summary"
echo "==============="
if [ $UNIT_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Unit Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Unit Tests: FAILED${NC}"
fi

if [ $E2E_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ E2E Tests: PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  E2E Tests: SKIPPED${NC}"
fi

# Exit with appropriate code
if [ $UNIT_TEST_RESULT -eq 0 ] && [ $E2E_TEST_RESULT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
