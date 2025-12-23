#!/bin/bash

# Quick Test Runner for Usage Billing Dashboard
# This script demonstrates how to run the data generator

echo "🚀 Usage Billing Dashboard - Quick Test"
echo "========================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Dev server is not running!"
    echo "Please start it with: npm run dev"
    exit 1
fi

echo "✓ Dev server is running"
echo ""

# Prompt for workspace ID
read -p "Enter Workspace ID (press Enter for default): " WORKSPACE_ID
WORKSPACE_ID=${WORKSPACE_ID:-694279240018241553bb}

echo ""
echo "📋 Instructions to get session cookie:"
echo "1. Log in to http://localhost:3000 as admin"
echo "2. Open DevTools (F12)"
echo "3. Go to Application → Cookies"
echo "4. Find session cookie and copy value"
echo ""

read -p "Paste your session cookie (or press Enter to skip): " SESSION_COOKIE

echo ""
echo "🎲 Generating artificial usage data..."
echo ""

if [ -n "$SESSION_COOKIE" ]; then
    TEST_WORKSPACE_ID="$WORKSPACE_ID" TEST_SESSION_COOKIE="$SESSION_COOKIE" node generate-usage-data.js
else
    echo "⚠️  Running without authentication - events may fail to create"
    TEST_WORKSPACE_ID="$WORKSPACE_ID" node generate-usage-data.js
fi

echo ""
echo "✅ Test complete!"
echo ""
echo "🌐 Open dashboard: http://localhost:3000/workspaces/$WORKSPACE_ID/admin/usage"
echo ""
