#!/bin/bash
# =============================================================================
# Fairlx Billing Cron Setup Script for DigitalOcean Droplet
# =============================================================================
#
# Usage:
#   1. Copy this script to your Droplet
#   2. Edit the variables below
#   3. Run: chmod +x setup-billing-cron.sh && ./setup-billing-cron.sh
#
# =============================================================================

# ============ CONFIGURATION - EDIT THESE ============
APP_URL="https://app.fairlx.com"
CRON_SECRET="BaGODIeObegylPWGxpGm5aJROLCGXcyotcjFP7P0FMc="
LOG_DIR="/var/log/fairlx-billing"
# =====================================================

# Create log directory
echo "Creating log directory..."
sudo mkdir -p "$LOG_DIR"
sudo chown $USER:$USER "$LOG_DIR"

# Create the cron job scripts
echo "Creating billing cron scripts..."

# Process Cycle Script (Monthly)
cat > /tmp/billing-process-cycle.sh << EOF
#!/bin/bash
LOG_FILE="$LOG_DIR/process-cycle.log"
echo "[\$(date -Iseconds)] Starting billing cycle processing..." >> \$LOG_FILE
response=\$(curl -s -w "\\n%{http_code}" -X POST \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  -H "Content-Type: application/json" \\
  "$APP_URL/api/cron/billing/process-cycle" 2>&1)
http_code=\$(echo "\$response" | tail -n1)
body=\$(echo "\$response" | sed '\$d')
echo "[\$(date -Iseconds)] Response (\$http_code): \$body" >> \$LOG_FILE
EOF

# Enforce Grace Script (Daily)
cat > /tmp/billing-enforce-grace.sh << EOF
#!/bin/bash
LOG_FILE="$LOG_DIR/enforce-grace.log"
echo "[\$(date -Iseconds)] Starting grace period enforcement..." >> \$LOG_FILE
response=\$(curl -s -w "\\n%{http_code}" -X POST \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  -H "Content-Type: application/json" \\
  "$APP_URL/api/cron/billing/enforce-grace" 2>&1)
http_code=\$(echo "\$response" | tail -n1)
body=\$(echo "\$response" | sed '\$d')
echo "[\$(date -Iseconds)] Response (\$http_code): \$body" >> \$LOG_FILE
EOF

# Send Reminders Script (Daily)
cat > /tmp/billing-send-reminders.sh << EOF
#!/bin/bash
LOG_FILE="$LOG_DIR/send-reminders.log"
echo "[\$(date -Iseconds)] Starting reminder email processing..." >> \$LOG_FILE
response=\$(curl -s -w "\\n%{http_code}" -X POST \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  -H "Content-Type: application/json" \\
  "$APP_URL/api/cron/billing/send-reminders" 2>&1)
http_code=\$(echo "\$response" | tail -n1)
body=\$(echo "\$response" | sed '\$d')
echo "[\$(date -Iseconds)] Response (\$http_code): \$body" >> \$LOG_FILE
EOF

# Move scripts to /usr/local/bin
sudo mv /tmp/billing-process-cycle.sh /usr/local/bin/
sudo mv /tmp/billing-enforce-grace.sh /usr/local/bin/
sudo mv /tmp/billing-send-reminders.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/billing-*.sh

echo "Installing cron jobs..."

# Install cron jobs
(crontab -l 2>/dev/null | grep -v "billing-") | crontab -

# Add new cron jobs
(crontab -l 2>/dev/null; cat << EOF

# ============ Fairlx Billing Cron Jobs ============
# Monthly billing cycle (1st at midnight UTC)
0 0 1 * * /usr/local/bin/billing-process-cycle.sh

# Daily grace period enforcement (1 AM UTC)
0 1 * * * /usr/local/bin/billing-enforce-grace.sh

# Daily reminder emails (9 AM UTC)  
0 9 * * * /usr/local/bin/billing-send-reminders.sh
# ==================================================
EOF
) | crontab -

echo ""
echo "✅ Billing cron jobs installed successfully!"
echo ""
echo "Cron jobs configured:"
echo "  • Monthly billing cycle: 1st of each month at midnight UTC"
echo "  • Daily grace enforcement: 1 AM UTC"
echo "  • Daily reminders: 9 AM UTC"
echo ""
echo "Log files location: $LOG_DIR"
echo ""
echo "Useful commands:"
echo "  View crontab:    crontab -l"
echo "  View logs:       tail -f $LOG_DIR/*.log"
echo "  Test manually:   /usr/local/bin/billing-enforce-grace.sh"
echo ""
