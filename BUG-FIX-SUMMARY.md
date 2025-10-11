# Bug Fix: Unfair Assignment Rotation

## Problem Identified

The rotation algorithm had a bug causing unfair distribution of assignments:
- **Pius Omondi** appeared 5 times in 9 weeks for Puonjruok Muma (should be ~2 times with 5 people)
- **Caleb Onyango** appeared 5 times in 9 weeks for Assignment 1 (should be ~2 times with 4 people)
- **Benedict Olweny** appeared 4 times in 9 weeks for Assignment 2 (should be ~2 times with 5 people)

## Root Cause

The algorithm had TWO bugs in `/src/components/MeetingScheduler.jsx`:

### Bug 1: Gave up too early (Line 1105)
```javascript
// OLD CODE:
if (attempts < maxAttempts / 2) { // Only try alternatives for first half of attempts
```

With a 5-person list, this only tried to avoid overloaded people for 2 attempts, then gave up.

### Bug 2: Too lenient threshold (Line 1113)
```javascript
// OLD CODE:
if (totalHistoricalCount > avgAssignments + 2) {
```

This allowed someone to have 2 MORE assignments than average before being skipped.

### Bug 3: No tracking within current schedule
The algorithm only checked historical data, not how many times someone was assigned in the CURRENT schedule being built.

## Changes Made

### 1. Extended attempt range (Line 1108)
```javascript
// NEW CODE:
if (attempts < maxAttempts - 1) { // Try alternatives for all but last attempt
```

Now tries to find better candidates through almost all attempts.

### 2. Stricter fairness threshold (Line 1116)
```javascript
// NEW CODE:
if (totalHistoricalCount > avgAssignments + 1) { // Changed from +2 to +1
```

Now skips someone if they have MORE than 1 assignment above average.

### 3. Added current schedule tracking (Lines 478, 1125-1141)
```javascript
// NEW: Track assignments across the ENTIRE schedule
const scheduleAssignmentCount = new Map();

// Later in code:
scheduleAssignmentCount.set(name, (scheduleAssignmentCount.get(name) || 0) + 1);

// And check it:
if (currentScheduleCount > avgInSchedule + 1) {
  canAssign = false; // Skip overloaded person
}
```

### 4. Enhanced reporting (Lines 1308-1342)
Added detailed summary showing:
- How many times each brother was assigned
- Warning indicators (⚠️) for overloaded assignments
- Clear visibility into distribution fairness

## Expected Results

With these fixes:
- 5 people in a 9-week schedule → each should appear 1-2 times (fair distribution)
- 4 people in a 9-week schedule → each should appear 2-3 times (but balanced)
- The algorithm will try harder to distribute fairly before accepting imbalance
- Console output will clearly show if anyone is overloaded

## Testing

To test the fix:
1. Open the app and load your schedule
2. Click "Auto Assign"
3. Open browser console (F12)
4. Look for the "BROTHER ASSIGNMENT DISTRIBUTION" section
5. Verify no one has ⚠️ warnings (more than 3 assignments)

## Notes

- This fixes the ALGORITHM bug, but small lists still require some repetition
- With only 4-5 people, perfect balance isn't always possible
- The fix ensures fairness is prioritized as much as mathematically possible
