#!/bin/bash

# ==============================================================================
# Fairlx GitHub Config Synchronizer
# 
# Usage: ../scripts/ci/github-sync.sh .env.local --repo={UserName}/Fairlx

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

# Fetch target repo from git or argument
TARGET_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)

# Override with --repo flag if provided
for i in "$@"; do
  case $i in
    --repo=*)
      TARGET_REPO="${i#*=}"
      shift
      ;;
  esac
done

if [ -z "$TARGET_REPO" ]; then
    echo "❌ Error: Could not detect GitHub repository. Please run inside a git repo or use --repo=owner/repo"
    exit 1
fi

# Robust multi-line parsing using a temporary environment source
# We use a subshell to source the file and then iterate over the keys
# This avoids the "line-by-line" limitation of 'read'
echo "📦 Target Repository: $TARGET_REPO"
echo "🚀 Starting GitHub Sync from $ENV_FILE..."

# Extract all keys first
KEYS=$(grep -E '^[A-Z0-9_]+=' "$ENV_FILE" | cut -d'=' -f1)

for key in $KEYS; do
    # Skip Razorpay vars as per user preference if needed, or just sync all
    
    # Extract value correctly even if multi-line
    # We use 'sed' to get the value between KEY= and the next KEY= or EOF
    # But a safer way in bash for .env files is to source it in a controlled way:
    value=$(grep -v '^#' "$ENV_FILE" | sed -n "s/^$key=//p" | sed 's/^"//;s/"$//;s/^'\''//;s/'\''$//')
    
    # If the value is still multi-line (like a key), we need to be careful
    # Realistically, the best way to get the full value for multiline is:
    # (using a perl one-liner for reliable multiline extraction)
    value=$(perl -ne "BEGIN { $/ = undef; } print \$1 if /^$key=(.*?)^\w+=/ms || /^$key=(.*)\z/ms" "$ENV_FILE" | sed 's/^"//;s/"$//;s/^'\''//;s/'\''$//')

    if [ -z "$value" ]; then
        continue
    fi

    IS_SECRET=false
    for s in "${SECRETS_LIST[@]}"; do
        if [ "$s" == "$key" ]; then
            IS_SECRET=true
            break
        fi
    done

    if [ "$IS_SECRET" = true ]; then
        echo "🔒 Setting Secret: $key"
        echo "$value" | gh secret set "$key" --repo "$TARGET_REPO"
    else
        echo "📝 Setting Variable: $key"
        gh variable set "$key" --body "$value" --repo "$TARGET_REPO"
    fi
done

echo "✅ Sync complete! Your GitHub Actions environment is now ready."
