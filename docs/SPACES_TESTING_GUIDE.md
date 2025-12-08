# 🧪 Complete Spaces Testing Guide

## Overview
This guide walks you through testing the Spaces feature step-by-step, with potential issues to check at each stage.

---

## Pre-Testing Checklist

**Before you start**, ensure:**
- [ ] You're logged in with an admin account (needed to create spaces)
- [ ] You have access to a workspace
- [ ] The app is running without errors (`npm run dev`)
- [ ] Check browser console (F12) for any errors before each test

---

## Testing Flow

### **Phase 1: Navigation & UI**

#### **Step 1.1: Locate Spaces in Sidebar**
1. Go to any workspace
2. Look for "Spaces" section in the left sidebar
3. Verify you see:
   - ✅ "Spaces" heading with chevron icon
   - ✅ Info icon (ⓘ) next to it
   - ✅ Plus icon (+) if you're an admin

**Potential Issues:**
- ❌ Spaces section missing → Check if sidebar is loading correctly
- ❌ Icons not visible → CSS import issue, check `spaces.tsx` imports
- ❌ Plus icon missing for admins → Check `useCurrentMember` hook returns `isAdmin: true`

---

#### **Step 1.2: Hover Over Info Icon**
1. Hover your mouse over the info icon (ⓘ)
2. Wait 200ms
3. Verify tooltip appears saying "Click for Spaces guide"

**Potential Issues:**
- ❌ Tooltip doesn't appear → Check `Tooltip` component is imported correctly
- ❌ Tooltip shows wrong text → Verify `TooltipContent` text in `spaces.tsx`
- ❌ Tooltip appears in wrong position → Check `side="right"` and `align="start"` props

---

#### **Step 1.3: Click Info Icon**
1. Click the info icon (ⓘ)
2. Should navigate to `/workspaces/[workspaceId]/spaces?guide=true`
3. Verify you see the Spaces guide page with:
   - ✅ "Spaces" heading
   - ✅ "Show/Hide Guide" button
   - ✅ Hierarchy diagram
   - ✅ Detailed guide cards with examples

**Potential Issues:**
- ❌ Navigation doesn't work → Check router in `spaces.tsx`
- ❌ Guide page doesn't load → Check `spaces/page.tsx` client component
- ❌ Guide components don't render → Verify `SpacesGuide` component imports
- ❌ Layout issues in guide → Check CSS and Tailwind classes in `spaces-guide.tsx`

---

### **Phase 2: Space Creation**

#### **Step 2.1: Open Create Space Modal**
1. Click the Plus icon (+) next to Spaces
2. Modal should open with form fields:
   - ✅ Space Name input (placeholder: "Your Space Name")
   - ✅ Space Key input (placeholder: "e.g., ENG, MKT")
   - ✅ Description input (optional)
   - ✅ Create button

**Potential Issues:**
- ❌ Modal doesn't open → Check `useCreateSpaceModal` hook
- ❌ Form fields missing → Verify `create-space-form.tsx` component
- ❌ Tooltips on fields overflow → Check `HelpTooltip` with `side="right"`

---

#### **Step 2.2: Hover Over Help Tooltips**
1. Hover over "?" next to "Space Name"
2. Tooltip should explain: "A descriptive name for your space..."
3. Hover over "?" next to "Space Key"
4. Tooltip should explain: "A short uppercase identifier..."

**Potential Issues:**
- ❌ Tooltips overflow screen → Check `side="right"` and `align="start"` props added to HelpTooltip
- ❌ Tooltips appear at wrong position → Verify sideOffset value
- ❌ Help text is cut off → Check `max-w-xs` class on TooltipContent

---

#### **Step 2.3: Fill in Space Form**
1. Enter Space Name: `"Engineering"`
2. Enter Space Key: `"ENG"` (uppercase)
3. Enter Description: `"Engineering team projects"`
4. Click "Create Space"

**Potential Issues:**
- ❌ Can't type in fields → Check form control binding
- ❌ Space Key doesn't auto-uppercase → Check `className="uppercase"` on input
- ❌ Validation errors → Check:
  - Space Name required?
  - Space Key required?
  - Key length 2-10 characters?
  - Key must be uppercase?

---

#### **Step 2.4: Verify Space Created**
After clicking "Create Space":
1. Modal should close
2. New space appears in sidebar under "Spaces"
3. Space shows with:
   - ✅ Name: "Engineering"
   - ✅ Key badge: "ENG"
   - ✅ Colored icon dot
4. Console shows no errors

**Potential Issues:**
- ❌ Modal stays open → Check form submission handling
- ❌ Space doesn't appear in sidebar → Check `useGetSpaces` refetch
- ❌ Wrong space info displayed → Verify API response mapping
- ❌ Duplicate space created → Check for unintended re-renders

---

### **Phase 3: Space Navigation & Details**

#### **Step 3.1: Click on Space**
1. Click the newly created "Engineering" space in sidebar
2. Should navigate to `/workspaces/[id]/spaces/[spaceId]`
3. Should see:
   - ✅ Space header with icon and name "Engineering"
   - ✅ Badge showing "ENG" key
   - ✅ Description text
   - ✅ Action buttons: "Add Work Item", "Workflows", "Members", "Settings"

**Potential Issues:**
- ❌ Navigation fails → Check router.push in `spaces.tsx`
- ❌ Space ID not in URL → Verify params extraction in `[spaceId]/client.tsx`
- ❌ Wrong space details shown → Check `useGetSpace` hook returns correct data
- ❌ Space info misaligned → Check grid/flex layout in template

---

#### **Step 3.2: Verify Space is Selected**
1. Look at sidebar
2. Space "Engineering" should be highlighted with background color
3. Chevron next to space should be styled as selected

**Potential Issues:**
- ❌ Space not highlighted → Check `isSelected` logic in `SpaceItem` component
- ❌ Wrong space highlighted → Verify `selectedSpaceId` comparison with `space.$id`

---

### **Phase 4: Multiple Spaces**

#### **Step 4.1: Create Second Space**
1. Click Plus icon again
2. Create another space:
   - Name: `"Marketing"`
   - Key: `"MKT"`
3. Verify it appears in sidebar below first space

**Potential Issues:**
- ❌ Plus icon doesn't work second time → Check modal state management
- ❌ Can't create with same key? → Expected, should show validation error
- ❌ Second space doesn't appear → Check list refresh

---

#### **Step 4.2: Toggle Spaces Expansion**
1. Click the chevron next to "Spaces" heading to collapse
2. Spaces list disappears
3. Click again to expand
4. Spaces list reappears in same state

**Potential Issues:**
- ❌ List doesn't collapse → Check `setIsExpanded` state update
- ❌ List doesn't re-expand → Check state management
- ❌ UI not smooth → Check transition classes

---

#### **Step 4.3: Navigate Between Spaces**
1. Click "Engineering" space
2. Verify header shows "Engineering" with "ENG" key
3. Click "Marketing" space
4. Verify header shows "Marketing" with "MKT" key
5. Click "Engineering" again
6. Verify back to "Engineering" details

**Potential Issues:**
- ❌ Header doesn't update → Check component re-render on spaceId change
- ❌ Wrong space data shown → Verify API query dependency on spaceId
- ❌ URL doesn't change → Check router.push implementation

---

### **Phase 5: Empty State & Messaging**

#### **Step 5.1: Fresh Workspace (No Spaces)**
1. Create a new workspace (if possible)
2. Look at Spaces section
3. Should show:
   - ✅ "No spaces yet" message
   - ✅ Guide automatically shows (or toggle available)

**Potential Issues:**
- ❌ Message doesn't show → Check empty state condition in component
- ❌ Guide doesn't auto-show → Verify `useEffect` hook with searchParams

---

#### **Step 5.2: Empty Space (No Work Items)**
1. Create a space
2. Click on it
3. Should show message:
   - ✅ "No work items in this space yet"
   - ✅ "Create Work Item" button

**Potential Issues:**
- ❌ Shows random items → Check space filter in `useGetWorkItems`
- ❌ No empty state message → Verify conditional rendering

---

### **Phase 6: Permissions & Non-Admin Users**

#### **Step 6.1: Admin Perspective**
1. Logged in as admin
2. Verify:
   - ✅ Can see Plus icon to create spaces
   - ✅ Can access "Members" tab on spaces
   - ✅ Can access "Settings" tab on spaces

**Potential Issues:**
- ❌ Icons not showing → Check `isAdmin` flag from `useCurrentMember`

---

#### **Step 6.2: Non-Admin Perspective** (if available)
1. Invite another user as non-admin
2. They should see:
   - ✅ Spaces in sidebar (read-only)
   - ✅ Can click and view spaces
   - ✅ No Plus icon (can't create)
3. Attempting to access `/spaces/[id]/members` or `/settings` should show permission denied

**Potential Issues:**
- ❌ Non-admins see create button → Check permission logic
- ❌ Non-admins can create spaces → Backend security issue

---

### **Phase 7: Browser Console & Performance**

#### **Step 7.1: Check Console for Errors**
1. Open DevTools (F12)
2. Go to Console tab
3. While testing spaces, verify:
   - ✅ No red error messages
   - ✅ No warnings about missing deps
   - ✅ No infinite loop warnings

**Common Errors to Look For:**
- ❌ `"Cannot read property 'documents' of undefined"` → useGetSpaces not returning data
- ❌ `"workspaceId is undefined"` → useWorkspaceId hook issue
- ❌ `"Missing required props"` → Component prop passing issue

---

#### **Step 7.2: Check Network Requests**
1. Open DevTools Network tab
2. Create a space
3. Verify:
   - ✅ POST request to create space succeeds (200/201 status)
   - ✅ GET request to fetch spaces succeeds
   - ✅ No duplicate requests (check for unintended re-renders)

**Potential Issues:**
- ❌ POST returns 400 → Form validation error, check request body
- ❌ POST returns 401 → Auth token missing or expired
- ❌ Multiple identical requests → Useeffect running too many times

---

#### **Step 7.3: Performance Check**
1. Open DevTools Performance tab
2. Create a space and navigate between spaces
3. Verify:
   - ✅ Interactions complete within 500ms
   - ✅ No long tasks (>50ms)
   - ✅ Smooth 60fps animations

**Potential Issues:**
- ❌ Slow navigation → Check useGetSpaces query optimization
- ❌ Janky animations → Review Tailwind transition classes

---

## Quick Issue Checklist

### UI Issues
- [ ] Icons not appearing → Import issue in `spaces.tsx`
- [ ] Tooltips overflowing → `HelpTooltip` side/align props not set to `"right"` and `"start"`
- [ ] Layout broken → Tailwind CSS not included or purge issue
- [ ] Colors not showing → `space.color` not stored or undefined fallback missing

### Functionality Issues
- [ ] Can't create spaces → Check admin permission and modal hook
- [ ] Spaces not appearing in list → Check `useGetSpaces` query and data structure
- [ ] Can't navigate to space → Check router and URL params
- [ ] Guide not showing → Check `searchParams` and `useEffect` in client

### Data Issues
- [ ] Wrong space displayed → Check spaceId in URL vs component
- [ ] Duplicate spaces → Check API for unique constraint
- [ ] Missing fields → Verify all fields returned from API

### Performance Issues
- [ ] Slow page load → Check useGetSpaces query caching
- [ ] Animations lag → Review CSS transitions
- [ ] Memory leak → Check useEffect cleanup functions

---

## Testing Scenarios Summary

| Scenario | Expected | Priority |
|----------|----------|----------|
| Hover info icon | Tooltip appears | High |
| Click info icon | Navigate to guide | High |
| Create space | Space appears in list | High |
| Fill form fields | No overflow issues | High |
| Navigate between spaces | Details update | High |
| Non-admin view | No create button | Medium |
| Empty state | Shows message | Medium |
| Console | No errors | High |

---

## Reporting Issues

When you find a problem, note:
1. **Step**: Which test step failed?
2. **Expected**: What should happen?
3. **Actual**: What actually happened?
4. **Console**: Any errors in DevTools?
5. **URL**: What's the current URL?
6. **User Role**: Admin or regular user?
7. **Browser**: Chrome/Safari/Firefox?

**Example:**
> **Step**: 2.2 Hover Over Help Tooltips
> **Expected**: Tooltip appears with helpful text, positioned to the right
> **Actual**: Tooltip overflows the right edge of screen
> **Console**: No errors
> **URL**: `/workspaces/abc123/spaces`
> **User Role**: Admin
> **Browser**: Chrome 120

---

## Success Criteria

All tests pass when:
- ✅ All UI elements render correctly
- ✅ Tooltips appear and don't overflow
- ✅ Space creation works for admins
- ✅ Space navigation works smoothly
- ✅ Form validation works
- ✅ Non-admins can't create spaces
- ✅ No console errors
- ✅ Network requests succeed
- ✅ Guide page displays correctly
- ✅ Performance is acceptable (<500ms per action)

---

## Additional Notes

### Testing Tips
1. **Clear browser cache** between test runs: Cmd+Shift+Delete
2. **Test in different browsers** (Chrome, Safari, Firefox)
3. **Test on mobile** using DevTools device mode
4. **Test with slow network**: DevTools → Network → Slow 3G
5. **Test with many spaces**: Create 10+ spaces to check list performance

### Files to Check If Issues Arise
- `src/components/spaces.tsx` - Sidebar component
- `src/features/spaces/components/spaces-guide.tsx` - Guide UI
- `src/app/(dashboard)/workspaces/[workspaceId]/spaces/client.tsx` - Spaces page
- `src/features/spaces/components/create-space-form.tsx` - Form component
- `src/features/spaces/api/use-get-spaces.ts` - Data fetching

---

## Questions?

Refer to:
- `docs/SPACES_GUIDE.md` - User-facing guide
- `DATABASE_UPDATES.md` - Database schema for spaces
- `FEATURES_COMPLETE.md` - Feature implementation notes
