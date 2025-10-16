# Tutorial & Help Features

## Interactive Tutorial System

### When Tutorial Appears
- **First Visit**: Automatically shows when a new user opens the app for the first time
- **Manual Trigger**: Users can click the **"? Help"** button next to the title anytime to restart the tutorial

### Tutorial Steps

#### Step 1: Add Participants
- **Location**: Points to participant lists area
- **Message**: "Click on any participant list below, then click the **+** button to add names. Add everyone who will be assigned tasks."

#### Step 2: Import EPUB
- **Location**: Points to "Import PDF/EPUB" button
- **Message**: "Click this button to upload a Luganda workbook (mwb_LU_*.epub). The app will automatically create weeks with songs and assignments."

#### Step 3: Auto Assign
- **Location**: Points to "Auto Assign" button
- **Message**: "Click here to automatically assign all participants fairly. The app uses smart rotation to ensure everyone gets equal opportunities and sister pairs never repeat."

#### Step 4: Save Schedule
- **Location**: Points to "Save Schedule" button
- **Message**: "Save your schedule here. The app tracks history to ensure fair rotation in future months and prevents repeating sister partnerships."

#### Step 5: View History
- **Location**: Points to "History" button
- **Message**: "Access all your saved schedules here. You can view, edit, or load previous schedules. Past schedules help the app ensure fair assignments."

### Tutorial Navigation
- **Next →** - Move to next step
- **← Back** - Return to previous step
- **Skip** - Exit tutorial (marks as seen)
- **✓ Got it!** - Complete tutorial (marks as seen)

### Tutorial Features
- ✅ **Pulsing border animation** - Draws attention to highlighted areas
- ✅ **Dark overlay** - Focuses user on current step
- ✅ **Remember preference** - Won't show automatically after first completion
- ✅ **Restart anytime** - Click "? Help" button to see tutorial again

## Help Button

### Location
Next to "Meeting Schedule Manager" title in top-left

### Appearance
- Light blue background
- "?" icon with "Help" text
- Compact size, doesn't interfere with main interface

### Function
Clicking the Help button:
1. Shows the welcome screen (Step 0)
2. Allows users to walk through all 5 steps again
3. Perfect for users who skipped tutorial initially

## Apply Yourself Assignment Check

### Feature
Before running auto-assign, the app automatically checks for "Apply Yourself" assignments in the BUULIRA N'OBUNYIIKIVU (Ministry) section.

### Detection Keywords
- "Apply Yourself" (English)
- "Weekiriza" (Luganda)
- "Kolamu" (Luganda)

### Warning System
If an "Apply Yourself" assignment is found using the **Sisters** list, the app shows a warning:

```
Found "Apply Yourself" assignments using Sisters list. These might need brothers instead (5 min talk):

Week X, Item Y: "[Assignment Description]" is assigned to Sisters list but might need brothers (5 min talk)

Please check the dropdown for these assignments and select "Okwogera kwa Ddakiika 5 (5 min talk)" if needed, then try auto-assign again.

Do you want to proceed anyway?
```

### User Options
1. **Cancel** - User can fix the assignment list selection, then try auto-assign again
2. **Proceed** - User can continue with auto-assign if they know the assignment is correct

### Why This Matters
"Apply Yourself" assignments are typically for **brothers** (5 min talks), not sisters. The app helps prevent the mistake of assigning these to the sisters list by checking before auto-assign runs.

### Correct Setup
For "Apply Yourself" assignments for brothers:
1. Find the assignment in the schedule
2. Click the dropdown menu
3. Select **"Okwogera kwa Ddakiika 5 (5 min talk)"**
4. Then run auto-assign

## Sister Partnership Rules

### Soft Preference for Variety
The app tracks sister partnerships and tries to avoid repeating the same pairs **until nearly all other pairings have been exhausted**.

### How It Works
1. **First Priority**: Never pair sisters who have worked together recently
2. **Second Priority**: Try different combinations before repeating
3. **Final Resort**: After all or most pairs have been used, pairings can repeat

### Why "Nearly All"?
With limited sister participants, it's mathematically impossible to never repeat pairs forever. The system ensures maximum variety while remaining practical.

### Hard Constraints (Always Enforced)
- No sister as student more than once per schedule
- No sister as assistant more than once per schedule
- No sister appears more than twice total per schedule
- Same pair never repeats in the same schedule (even with role swap)
- Same pair won't repeat in consecutive schedules

## LocalStorage Usage

### Tutorial Preference
- **Key**: `hasSeenTutorial`
- **Value**: `'true'` after user completes or skips tutorial
- **Purpose**: Prevents tutorial from auto-showing on every visit
- **Reset**: Clear browser localStorage or click "? Help" button

### User Impact
- First-time users get guided tour
- Returning users don't see tutorial again
- Anyone can restart tutorial anytime via Help button

## Best Practices

### For First-Time Users
1. Don't skip the tutorial - it's quick and helpful!
2. Follow the steps in order
3. The app will remember you've seen it

### For Returning Users
- Click "? Help" if you need a refresher
- Tutorial is always available, never hidden
- Each step explains one key feature

### For Administrators
- Tutorial eliminates need for external documentation
- Users can self-learn the app
- Reduces support questions about basic features

## Future Enhancements (Possible)

- Add tooltips that appear on hover for each button
- Context-sensitive help based on current screen
- Video tutorial option
- Multilingual tutorial (Luganda text)
- Tutorial progress indicator (Step 3 of 5)
