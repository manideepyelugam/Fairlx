# Usage Testing Scripts

This directory contains utility scripts for testing and managing the usage billing system.

## Scripts

### `generate-usage-data.js`
Generates sample usage data for testing the billing system.

**Usage:**
```bash
node scripts/usage-testing/generate-usage-data.js
```

### `seed-usage-data.js`
Seeds usage data for a specific workspace.

**Usage:**
```bash
node scripts/usage-testing/seed-usage-data.js <workspaceId>
```

### `check-compute-events.js`
Checks compute events in the database and displays statistics.

**Usage:**
```bash
node scripts/usage-testing/check-compute-events.js
```

### `test-usage-metering.js`
Tests the usage metering integration and permissions.

**Usage:**
```bash
node scripts/usage-testing/test-usage-metering.js
```

### `test-usage-api.js`
Tests the usage API endpoints.

**Usage:**
```bash
node scripts/usage-testing/test-usage-api.js
```

## Requirements

All scripts require:
- `.env.local` file with Appwrite credentials
- `node-appwrite` package installed
- Admin API key configured

## Environment Variables

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT=
NEXT_APPWRITE_KEY=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=
NEXT_PUBLIC_APPWRITE_USAGE_EVENTS_ID=
```
