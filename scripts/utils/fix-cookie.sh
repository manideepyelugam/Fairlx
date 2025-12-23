#!/bin/bash

# Quick cookie format helper
# This fixes the cookie format to include the name

echo "🔧 Cookie Format Fixer"
echo "====================="
echo ""

if [ -z "$1" ]; then
    echo "Usage: ./fix-cookie.sh 'your-cookie-value'"
    echo ""
    echo "Example:"
    echo "./fix-cookie.sh 'eyJpZCI6IjY4Z...'"
    echo ""
    echo "This will output: fairlx-session=eyJpZCI6IjY4Z..."
    exit 1
fi

COOKIE_VALUE="$1"
FORMATTED_COOKIE="fairlx-session=$COOKIE_VALUE"

echo "✓ Formatted cookie:"
echo "$FORMATTED_COOKIE"
echo ""
echo "Use this with the test script:"
echo "TEST_SESSION_COOKIE='$FORMATTED_COOKIE' node generate-usage-data.js"
echo ""
