# Plan: Show All Programmes in Curriculum Section (No Authority Filter)

## Goal
Modify the "Programme register" section in `CurriculumManagement.tsx` to display all programmes across all academic authorities, instead of filtering by the currently selected authority.

## Current Behavior
- Line 1019 in `CurriculumManagement.tsx` filters programmes:
  ```tsx
  programmes.filter(item => resolveAcademicAuthority(item.regulator) === selectedAuthority)
  ```
- Only programmes belonging to the selected authority are shown.

## Required Changes

### 1. Modify Programme Register Display (CurriculumManagement.tsx)
**File:** `/workspace/app/frontend/src/components/CurriculumManagement.tsx`

**Changes:**
- Remove the authority filter from the programme table display (around line 1019)
- Show all programmes in the table
- Optionally add an "Authority" column to indicate which authority each programme belongs to
- Keep the form for creating/editing programmes scoped to the selected authority (this should remain as-is since you can only create programmes under the selected authority)

### 2. Update Programme Form Authority Handling
The programme creation/edit form (lines 991-1016) uses `authority` from state to set the `regulator` field. This should remain scoped to the selected authority since users can only create programmes under the currently selected authority.

### 3. Consider Adding Authority Column
Add an "Authority" column to the programmes table showing the regulator/authority name for each programme, so users can see which authority owns each programme.

## Implementation Details

### Table Columns (Current)
| Code | Programme | Award | Duration | Verification | Status | Actions |

### Table Columns (Proposed)
| Code | Programme | Award | Duration | Verification | Status | Authority | Actions |

## Files to Modify
- `/workspace/app/frontend/src/components/CurriculumManagement.tsx` - Main changes

## Validation
1. Load the curriculum management page
2. Select an authority
3. Verify the "Programme register" table shows programmes from ALL authorities (not just the selected one)
4. Verify the "Authority" column displays correctly
5. Verify creating/editing programmes still works and associates with the selected authority