# Sister Pair Hard Constraint Implementation

## Summary
Implemented a hard constraint to prevent the same two sisters from being paired together in the same schedule, even if their roles (student/assistant) are swapped.

## Problem
Previously, the system allowed pairs like:
- Week 3: Jane (student) / Mary (assistant)
- Week 7: Mary (student) / Jane (assistant)

This was technically allowed because the roles were different, but it reduced partnership variety and could create perception issues.

## Solution

### 1. Added Pair Tracking Infrastructure (Line ~437)
```javascript
// Track sister pairs used in current schedule to prevent same pairs with swapped roles
const usedSisterPairs = new Set();

// Helper function to create normalized pair key (alphabetically sorted)
const createPairKey = (sister1, sister2) => {
  return [sister1, sister2].sort().join('|');
};
```

**How it works:**
- Pair keys are normalized (alphabetically sorted) so "Jane|Mary" and "Mary|Jane" produce the same key
- Example: `createPairKey("Mary", "Jane")` → `"Jane|Mary"`
- Example: `createPairKey("Jane", "Mary")` → `"Jane|Mary"`
- Both produce identical keys, making role swap detection automatic

### 2. Added Hard Constraint Check in Main Assistant Selection (Line ~898)
```javascript
// HARD CONSTRAINT: Check if this pair has been used in current schedule
const pairKey = createPairKey(student, candidate);
if (usedSisterPairs.has(pairKey)) {
  console.log(`🚫 Blocking ${candidate}: pair "${pairKey}" already used in this schedule`);
  return null; // Hard constraint - cannot use same pair even with roles swapped
}
```

**Effect:**
- Filters out assistant candidates who would create a duplicate pair
- Logs blocked candidates for debugging visibility
- Completely prevents the pairing (not just a scoring penalty)

### 3. Tracked Pairs After Assignment (Line ~959)
```javascript
// Track this pair to prevent same pair with swapped roles later
const pairKey = createPairKey(student, assistant);
usedSisterPairs.add(pairKey);
console.log(`🔗 Tracked pair: ${pairKey} (prevents role swap repetition)`);
```

**Effect:**
- Records each assigned pair immediately
- Prevents future assignments with the same pair in any role configuration
- Logs tracking for debugging

### 4. Added Same Check to Fallback Logic (Line ~1002+)
```javascript
// HARD CONSTRAINT: Check if this pair has been used in current schedule
const pairKey = createPairKey(fallbackStudent, sisterData.name);
if (usedSisterPairs.has(pairKey)) {
  console.log(`🚫 Blocking ${sisterData.name} in fallback: pair "${pairKey}" already used`);
  return false;
}
```

**Effect:**
- Ensures fallback assignments also respect the pair constraint
- Maintains consistency across all assignment paths

### 5. Updated Emergency Fallback Sections (Lines ~1095, ~1115)
Added pair tracking even in emergency mode to maintain consistency.

## Constraint Types

### Hard Constraints (MUST be satisfied)
1. ✅ Max 1 student role per schedule
2. ✅ Max 1 assistant role per schedule  
3. ✅ Max 2 total appearances per schedule
4. ✅ Must alternate roles between schedules
5. ✅ **NEW: Cannot pair same sisters even with swapped roles in same schedule**

### Soft Preferences (Optimized but not required)
1. Maximize spacing between appearances
2. Rotate through different TIEGRI points
3. Avoid repeat partnerships across schedules (uses historical data, -15 point penalty)

## Example Scenario

### Before This Change:
```
Week 2: Jane (student) / Mary (assistant)  ✅ Allowed
Week 6: Mary (student) / Jane (assistant)  ✅ Allowed (different roles)
```

### After This Change:
```
Week 2: Jane (student) / Mary (assistant)  ✅ Allowed
Week 6: Mary (student) / Jane (assistant)  🚫 BLOCKED (same pair)
Week 6: Mary (student) / Sarah (assistant) ✅ Assigned instead (new pair)
```

## Benefits
1. **Increased Variety**: Forces rotation through different partner combinations
2. **Fairness**: All sisters get to work with different partners throughout the schedule
3. **Perception**: Avoids appearance of favoritism or "cliques"
4. **Better Learning**: Sisters gain experience working with multiple partners

## Technical Details

**Scope**: Schedule-level (8-9 weeks)
- Pair constraint resets when new schedule is generated
- Historical data still tracks cross-schedule partnerships for soft preference

**Performance**: O(1) lookup using Set
- Very fast pair checking
- Minimal memory overhead

**Debugging**: All blocking actions are logged
- Easy to see which pairs are blocked and why
- Console shows: `🚫 Blocking [name]: pair "[pair_key]" already used in this schedule`
- Tracks pairs with: `🔗 Tracked pair: [pair_key] (prevents role swap repetition)`

## Related Code Locations
- Line ~437: Pair tracking infrastructure initialization
- Line ~898: Main assistant selection hard constraint
- Line ~959: Pair tracking after successful assignment
- Line ~1002: Fallback assistant selection hard constraint
- Line ~1055: Fallback pair tracking
- Line ~1095: Emergency fallback pair tracking
- Line ~1115: Absolute emergency fallback pair tracking

## Testing Recommendations
1. Generate a new 8-week schedule with sisters
2. Check console logs for pair tracking messages
3. Verify no pair appears twice (even with swapped roles)
4. Confirm adequate variety in partnerships
5. Ensure all hard constraints still satisfied

## Notes
- This constraint only applies within a single schedule
- Cross-schedule partnerships are still tracked in historical data for soft preference scoring
- Emergency fallbacks also respect this constraint when possible
- Works seamlessly with all existing constraints and rotation logic
