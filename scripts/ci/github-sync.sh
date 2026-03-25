#!/bin/bash

# ==============================================================================
# Fairlx GitHub Config Synchronizer
# 
# Usage: ./scripts/ci/github-sync.sh [.env.file]
#
# Prerequisites:
# 1. Install GitHub CLI: brew install gh
# 2. Authenticate: gh auth login
# ==============================================================================

ENV_FILE=${1:-.env.local}

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: File $ENV_FILE not found."
    exit 1
fi

# List of keys that MUST be stored as SECRETS (everything else becomes a VARIABLE)
SECRETS_LIST=(
    "NEXT_APPWRITE_KEY"
    "CASHFREE_SECRET_KEY"
    "CASHFREE_WEBHOOK_SECRET"
    "EXCHANGE_RATE_API_KEY"
    "CRON_SECRET"
    "WALLET_SIG_SECRET"
    "GH_PERSONAL_TOKEN"
    "GEMINI_API_KEY"
    "LANDING_SUPABASE_SERVICE_ROLE_KEY"
    "SOCKET_PUSH_SECRET"
    "R2_ACCOUNT_ID"
    "R2_ACCESS_KEY_ID"
    "R2_SECRET_ACCESS_KEY"
    "TWO_FACTOR_ENCRYPTION_SECRET"
    "BYOB_ENCRYPTION_SECRET"
    "REDIS_URL"
    "REDIS_PASSWORD"
    "EMAIL_API_KEY"
    "DO_SSH_PRIVATE_KEY"
)

echo "🚀 Starting GitHub Sync from $ENV_FILE..."

# Read file line by line
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Strip whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Check if value is empty (optional check)
    if [ -z "$value" ]; then
        echo "⚠️ Skipping $key: Value is empty."
        continue
    fi

    # Determine if it's a secret or variable
    IS_SECRET=false
    for s in "${SECRETS_LIST[@]}"; do
        if [ "$s" == "$key" ]; then
            IS_SECRET=true
            break
        fi
    done

    if [ "$IS_SECRET" = true ]; then
        echo "🔒 Setting Secret: $key"
        gh secret set "$key" --body "$value"
    else
        echo "📝 Setting Variable: $key"
        gh variable set "$key" --body "$value"
    fi

done < "$ENV_FILE"

echo "✅ Sync complete! Your GitHub Actions environment is now ready."
