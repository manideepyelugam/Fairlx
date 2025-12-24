# Appwrite Collections Setup Guide

## Prerequisites
- Access to your Appwrite Console
- Database already created (you should have `DATABASE_ID` in your `.env.local`)

---

## Step 1: Create `organizations` Collection

### 1.1 Navigate to Database
1. Open **Appwrite Console** → **Databases**
2. Select your database (the one matching `NEXT_PUBLIC_APPWRITE_DATABASE_ID`)
3. Click **Create collection**

### 1.2 Collection Settings
- **Collection ID**: `organizations` (or click "Generate" for auto-ID)
- **Collection Name**: `organizations`
- Click **Create**

### 1.3 Add Attributes

Click **Attributes** tab, then **Create attribute** for each:

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| `name` | String | 128 | ✅ Yes | - |
| `imageUrl` | String | 10000 | ❌ No | - |
| `billingSettings` | String | 5000 | ❌ No | - |
| `createdBy` | String | 36 | ✅ Yes | - |
| `billingStartAt` | String | 30 | ❌ No | - |

**WHY these sizes:**
- `name`: Max org name length
- `imageUrl`: Base64 data URLs can be large
- `billingSettings`: JSON for payment config
- `createdBy`: Appwrite user ID length
- `billingStartAt`: ISO timestamp length

### 1.4 Add Indexes

Click **Indexes** tab, then **Create index**:

| Index Key | Type | Attributes |
|-----------|------|------------|
| `createdBy_idx` | Key | `createdBy` |

### 1.5 Set Permissions

Click **Settings** tab → **Permissions**:
- **Role: Users** → Check: Read, Create, Update, Delete

> ⚠️ For production, use more restrictive permissions with Appwrite Functions for server-side operations.

### 1.6 Copy Collection ID

Click on collection name, copy the **Collection ID** from the right panel.
Save this for your `.env.local`.

---

## Step 2: Create `organization_members` Collection

### 2.1 Create Collection
1. In same database, click **Create collection**
2. **Collection ID**: `organization_members`
3. **Collection Name**: `organization_members`
4. Click **Create**

### 2.2 Add Attributes

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| `organizationId` | String | 36 | ✅ Yes | - |
| `userId` | String | 36 | ✅ Yes | - |
| `role` | String | 20 | ✅ Yes | - |
| `name` | String | 128 | ❌ No | - |
| `email` | String | 320 | ❌ No | - |
| `profileImageUrl` | String | 10000 | ❌ No | - |

**WHY these sizes:**
- `organizationId`, `userId`: Appwrite ID length
- `role`: OWNER/ADMIN/MEMBER fits in 20
- `email`: RFC 5321 max email length

### 2.3 Add Indexes

| Index Key | Type | Attributes |
|-----------|------|------------|
| `orgId_idx` | Key | `organizationId` |
| `userId_idx` | Key | `userId` |
| `orgUser_unique` | Unique | `organizationId`, `userId` |
| `orgRole_idx` | Key | `organizationId`, `role` |

**WHY these indexes:**
- `orgId_idx`: List all members of an org
- `userId_idx`: List all orgs a user belongs to
- `orgUser_unique`: Prevent duplicate memberships
- `orgRole_idx`: Query owners/admins of an org

### 2.4 Set Permissions

Same as organizations:
- **Role: Users** → Check: Read, Create, Update, Delete

### 2.5 Copy Collection ID

Copy the **Collection ID** for your `.env.local`.

---

## Step 3: Update Environment Variables

Open `/Users/surendram.dev/Documents/CODE/Fairlx/Fairlx-main/.env.local` and add:

```bash
# Organizations & Account Management
NEXT_PUBLIC_APPWRITE_ORGANIZATIONS_ID=<paste_organizations_collection_id>
NEXT_PUBLIC_APPWRITE_ORGANIZATION_MEMBERS_ID=<paste_organization_members_collection_id>
```

---

## Step 4: Extend Workspaces Collection (Optional)

If workspace collection doesn't have these attributes yet, add them:

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| `organizationId` | String | 36 | ❌ No | - |
| `isDefault` | Boolean | - | ❌ No | `false` |
| `billingScope` | String | 20 | ❌ No | `user` |

---

## Verification Checklist

- [ ] `organizations` collection created
- [ ] 5 attributes added to organizations
- [ ] `createdBy_idx` index created
- [ ] `organization_members` collection created
- [ ] 6 attributes added to organization_members
- [ ] 4 indexes created on organization_members
- [ ] Both collection IDs added to `.env.local`
- [ ] Restart dev server (`npm run dev`)

---

## Quick Reference: Collection IDs

After setup, your `.env.local` should have:

```
NEXT_PUBLIC_APPWRITE_ORGANIZATIONS_ID=67xxxxxxxxxxxxxxxx
NEXT_PUBLIC_APPWRITE_ORGANIZATION_MEMBERS_ID=67xxxxxxxxxxxxxxxx
```
