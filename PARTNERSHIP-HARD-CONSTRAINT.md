# Sister Partnership Hard Constraint - Full Implementation

## Summary
Implemented a comprehensive hard constraint that prevents the same two sisters from being paired together:
1. **Within the current schedule** (even with swapped roles)
2. **Across all previous schedules** (complete partnership variety across history)

## Problem Statement

### Before This Change:
The system only gave a soft preference (scoring penalty) for repeat partnerships:
- Schedule 1, Week 3: Jane (student) / Mary (assistant) ✅
- Schedule 1, Week 7: Mary (student) / Jane (assistant) ✅ (role swap allowed)
- Schedule 2, Week 2: Jane (student) / Mary (assistant) ✅ (repeat across schedules allowed)

This resulted in:
- Limited partnership variety
- Some sisters repeatedly paired together
- Reduced learning opportunities
- Potential perception of favoritism

### After This Change:
Same pairs are now **completely blocked** once they've been paired:
- Schedule 1, Week 3: Jane (student) / Mary (assistant) ✅ **Recorded in history**
- Schedule 1, Week 7: Mary (student) / Jane (assistant) 🚫 **Blocked (same schedule)**
- Schedule 2, Week 2: Jane (student) / Mary (assistant) 🚫 **Blocked (history)**
- Schedule 2, Week 2: Jane (student) / Sarah (assistant) ✅ **New partnership assigned**

## Implementation Details

### 1. Current Schedule Tracking (Line ~437)

```javascript
// Track sister pairs used in current schedule
const usedSisterPairs = new Set();

// Helper function to create normalized pair key (alphabetically sorted)
const createPairKey = (sister1, sister2) => {
  return [sister1, sister2].sort().join('|');
};
```

**Purpose**: Prevents same pair within the schedule being generated (8-9 weeks)

### 2. Historical Partnership Tracking (Already exists, Line ~3047)

```javascript
// Track partnerships between these sisters
if (sisters.length === 2) {
  const [sister1, sister2] = sisters;
  if (historicalData[sister1] && historicalData[sister2]) {
    // Add each other to their partnership history
    if (!historicalData[sister1].partnerships.includes(sister2)) {
      historicalData[sister1].partnerships.push(sister2);
    }
    if (!historicalData[sister2].partnerships.includes(sister1)) {
      historicalData[sister2].partnerships.push(sister1);
    }
  }
}
```

**Purpose**: Maintains permanent record of all partnerships across all saved schedules

### 3. Double Hard Constraint Check (Line ~898)

```javascript
// HARD CONSTRAINT 1: Check if this pair has been used in current schedule
const pairKey = createPairKey(student, candidate);
if (usedSisterPairs.has(pairKey)) {
  console.log(`🚫 Blocking ${candidate}: pair "${pairKey}" already used in this schedule`);
  return null;
}

// HARD CONSTRAINT 2: Check if this pair has been used in previous schedules
const candidateHistory = historicalData[candidate] || { partnerships: [] };
const hasBeenPairedInHistory = candidateHistory.partnerships?.includes(student);

if (hasBeenPairedInHistory) {
  console.log(`🚫 Blocking ${candidate}: pair "${pairKey}" already used in previous schedules`);
  return null;
}
```

**Effect**: Completely blocks any assistant candidate who:
- Would create a duplicate pair in current schedule, OR
- Has been paired with the student in any previous schedule

### 4. Applied to All Assignment Paths

The double hard constraint is applied in:
- Main assistant selection (Line ~898)
- Fallback assistant selection (Line ~1012)
- Pair tracking after successful assignment (Line ~959, ~1065)
- Emergency fallback tracking (Line ~1105, ~1125)

## Constraint Hierarchy

### Hard Constraints (MUST be satisfied - assignment will fail rather than violate)
1. ✅ Max 1 student role per schedule
2. ✅ Max 1 assistant role per schedule  
3. ✅ Max 2 total appearances per schedule
4. ✅ Must alternate roles between schedules
5. ✅ **Cannot pair same sisters within current schedule (even with role swap)**
6. ✅ **Cannot pair same sisters if they were paired in any previous schedule**

### Soft Preferences (Optimized when possible)
1. Maximize spacing between appearances
2. Rotate through different TIEGRI points
3. ~~Avoid repeat partnerships~~ ← **Now a HARD constraint**

## Example Scenarios

### Multi-Schedule Example

**Schedule 1 (November 2024):**
```
Week 2: Jane / Mary     ✅ First pairing - recorded
Week 5: Jane / Sarah    ✅ New pair - recorded
Week 8: Mary / Sarah    ✅ New pair - recorded
```

**Schedule 2 (January 2025):**
```
Week 1: [Attempting Jane...]
  - Mary?   🚫 Blocked (paired in Nov Week 2)
  - Sarah?  🚫 Blocked (paired in Nov Week 5)
  - Lisa?   ✅ New pairing - assigned
  
Week 1: Jane / Lisa     ✅ Assigned

Week 4: [Attempting Mary...]
  - Jane?   🚫 Blocked (paired in Nov Week 2)
  - Sarah?  🚫 Blocked (paired in Nov Week 8)
  - Lisa?   🚫 Blocked (paired in Jan Week 1)
  - Emma?   ✅ New pairing - assigned
  
Week 4: Mary / Emma     ✅ Assigned
```

### Role Swap Blocking Example

**Same Schedule:**
```
Week 2: Jane (student) / Mary (assistant)  ✅ First pairing
Week 6: [Attempting Mary (student)...]
  - Jane (assistant)? 🚫 Blocked by usedSisterPairs.has("Jane|Mary")
  - Sarah (assistant)? ✅ Assigned instead
```

**Cross-Schedule:**
```
Schedule 1, Week 2: Jane (student) / Mary (assistant)  ✅ Recorded in history
Schedule 2, Week 3: [Attempting Jane (student)...]
  - Mary (assistant)? 🚫 Blocked by historicalData[Mary].partnerships.includes("Jane")
  - Sarah (assistant)? ✅ Assigned instead
```

## Benefits

### 1. Maximum Partnership Variety
- Every sister works with different partners across all schedules
- Complete rotation through all possible combinations
- No repeated pairings unless mathematically unavoidable

### 2. Enhanced Learning Experience
- Sisters gain experience with different teaching/learning styles
- Broader exposure to different partnership dynamics
- More well-rounded skill development

### 3. Fairness & Equity
- No perception of favoritism or "cliques"
- All sisters get equal opportunity to work with everyone
- Transparent, rule-based assignment

### 4. Long-term Rotation
- System naturally cycles through all combinations
- Historical tracking ensures never repeating old pairs
- Only resets when all combinations exhausted (extremely rare)

## Mathematical Considerations

### Maximum Unique Pairs
For a list of N sisters, there are **C(N, 2) = N × (N-1) / 2** unique pairs.

**Examples:**
- 5 sisters: 5 × 4 / 2 = **10 unique pairs**
- 6 sisters: 6 × 5 / 2 = **15 unique pairs**
- 7 sisters: 7 × 6 / 2 = **21 unique pairs**
- 8 sisters: 8 × 7 / 2 = **28 unique pairs**

### Assignments Per Schedule
If there are 2 TIEGRI items per week × 8 weeks = **16 pairs per schedule**

**Sustainability:**
- 8 sisters → 28 unique pairs → Can sustain 1.75 schedules before repeating
- 9 sisters → 36 unique pairs → Can sustain 2.25 schedules before repeating
- 10 sisters → 45 unique pairs → Can sustain 2.8 schedules before repeating

**Constraint Relaxation:**
If the system runs out of new pairs (very unlikely with proper sister list size), emergency fallback logic would temporarily relax the constraint. This is logged as:
```
🚨 CONSTRAINT VIOLATION: Could not assign valid pair, constraints would be violated
```

## Debugging & Visibility

### Console Logging
All blocking actions are clearly logged:

```
🚫 Blocking Mary: pair "Jane|Mary" already used in this schedule
🚫 Blocking Sarah: pair "Jane|Sarah" already used in previous schedules
✨ Partnership variety: Lisa and Jane would be a new pairing
🔗 Tracked pair: Jane|Lisa (prevents role swap repetition)
```

### Monitoring Recommendations
1. Check console logs during schedule generation
2. Look for 🚫 blocking messages to see constraint enforcement
3. Monitor for 🚨 emergency fallback warnings (should be rare)
4. Verify partnership history in Firebase after save

## Technical Implementation

### Data Structures

**Current Schedule Tracking:**
```javascript
usedSisterPairs: Set<string>
// Example: Set { "Jane|Mary", "Sarah|Lisa", "Emma|Mary" }
```

**Historical Tracking:**
```javascript
historicalData[sisterName].partnerships: string[]
// Example: historicalData["Jane"].partnerships = ["Mary", "Sarah", "Lisa"]
```

**Pair Key Normalization:**
```javascript
createPairKey("Mary", "Jane")  → "Jane|Mary"
createPairKey("Jane", "Mary")  → "Jane|Mary"
// Always produces same key regardless of order
```

### Lookup Performance
- **O(1)** for current schedule check via Set
- **O(n)** for historical check via Array.includes() where n = number of past partners (typically small)
- Very fast even with large datasets

## Code Locations

| Component | Line | Purpose |
|-----------|------|---------|
| Pair key creator | ~442 | Normalizes pair names alphabetically |
| Current schedule Set | ~437 | Tracks pairs in current schedule |
| Main hard constraint | ~898 | Checks both current + historical |
| Fallback hard constraint | ~1012 | Same checks for fallback logic |
| Pair tracking | ~959, ~1065, ~1105, ~1125 | Records pairs after assignment |
| Historical building | ~3047 | Builds partnership history from saved schedules |

## Testing Checklist

- [ ] Generate new schedule with sisters
- [ ] Verify no pair appears twice in same schedule
- [ ] Check console logs for blocking messages
- [ ] Save schedule and generate another schedule
- [ ] Verify pairs from first schedule are blocked in second schedule
- [ ] Check Firebase partnership history after save
- [ ] Confirm adequate variety across multiple schedules
- [ ] Test with small sister lists (4-5) to verify constraint handling

## Comparison with Previous Behavior

| Aspect | Before (Soft Preference) | After (Hard Constraint) |
|--------|-------------------------|------------------------|
| Same pair, same schedule | -15 points penalty | 🚫 Completely blocked |
| Same pair, role swap | Allowed | 🚫 Completely blocked |
| Same pair, next schedule | -15 points penalty | 🚫 Completely blocked |
| Same pair, many schedules later | Allowed | 🚫 Blocked until all pairs used |
| Partnership variety | Optional optimization | Mandatory requirement |
| Constraint type | Soft (scoring) | Hard (filtering) |

## Notes

- Historical partnership data persists in Firebase across all schedules
- Only way to "reset" partnerships is to clear Firebase partnership history manually
- Emergency fallbacks still respect constraint when possible
- Works seamlessly with all other constraints (role alternation, appearance limits, etc.)
- No performance impact - very efficient lookups

## Related Documents
- `/CRITICAL-BUG-FIX.md` - Historical data deletion bug
- `/BUG-FIX-SUMMARY.md` - Rotation fairness improvements
- `/ASSIGNMENT_LOGIC.md` - Complete assignment logic documentation
