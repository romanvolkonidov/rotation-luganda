# Firebase Database Separation - Luganda vs Dholuo

## Problem
Both the Dholuo and Luganda versions of the meeting scheduler use the **same Firebase project**, but they need to maintain **separate, independent data** to avoid conflicts.

## Solution
Each version uses a different database path in Firebase Realtime Database:

### Firebase Project (Shared)
```
Project: tracking-budget-app
Database URL: https://tracking-budget-app-default-rtdb.firebaseio.com/
```

### Database Paths (Separated)

```
Firebase Realtime Database
├── meetingSchedule              ← Dholuo version (original)
│   ├── participantLists
│   ├── scheduleHistory
│   ├── previousAssignments
│   └── rotationIndices
│
└── meetingSchedule_Luganda      ← Luganda version (this repo)
    ├── participantLists
    ├── scheduleHistory
    ├── previousAssignments
    └── rotationIndices
```

## Deployment Architecture

### Dholuo Version
- **Repository**: `romanvolkonidov/rotation` (original repo)
- **Vercel Site**: `rotation-dholuo.vercel.app` (or similar)
- **Firebase Path**: `meetingSchedule`
- **Language**: Dhopadhola/Luo
- **Section Names**: MWANDU, TIEGRI, NGIMAWA

### Luganda Version
- **Repository**: `romanvolkonidov/rotation-luganda` (this repo)
- **Vercel Site**: `rotation-luganda.vercel.app` (or similar)
- **Firebase Path**: `meetingSchedule_Luganda`
- **Language**: Luganda
- **Section Names**: EKIGAMBO, BUULIRA, OBULAMU

## Code Implementation

### In `src/services/firebase.js` (Luganda Version)

```javascript
// SAVE - writes to meetingSchedule_Luganda
export const saveScheduleToFirebase = async (data, token = null) => {
  const scheduleRef = ref(database, 'meetingSchedule_Luganda');
  await set(scheduleRef, dataWithToken);
};

// LOAD - reads from meetingSchedule_Luganda
export const loadScheduleFromFirebase = async () => {
  const snapshot = await get(child(dbRef, 'meetingSchedule_Luganda'));
  // ...
};
```

### In `src/services/firebase.js` (Dholuo Version - Original Repo)

```javascript
// SAVE - writes to meetingSchedule
export const saveScheduleToFirebase = async (data, token = null) => {
  const scheduleRef = ref(database, 'meetingSchedule');
  await set(scheduleRef, dataWithToken);
};

// LOAD - reads from meetingSchedule
export const loadScheduleFromFirebase = async () => {
  const snapshot = await get(child(dbRef, 'meetingSchedule'));
  // ...
};
```

## Data Isolation Benefits

✅ **Complete Separation**
- Luganda data never touches Dholuo data
- Each version maintains its own:
  - Participant lists
  - Schedule history
  - Rotation indices
  - Previous assignments

✅ **Independent Operations**
- Saving Luganda schedule doesn't affect Dholuo
- Deleting Dholuo history doesn't affect Luganda
- Different participant names in each language
- Different rotation states

✅ **Shared Firebase Project**
- Use same Firebase credentials
- Same authentication system
- Single Firebase Console for management
- Cost-effective (one project instead of two)

## Firebase Console View

When you open Firebase Console → Realtime Database, you'll see:

```json
{
  "meetingSchedule": {
    "participantLists": {
      "chairmen": ["John Doe", "Steve Austin", "..."],
      "assignment1": ["..."],
      // Dholuo data
    },
    "scheduleHistory": [
      {
        "title": "NGECHE 1-8",
        "weeks": [...]
      }
    ]
  },
  "meetingSchedule_Luganda": {
    "participantLists": {
      "chairmen": ["Mukama", "Katonda", "..."],
      "assignment1": ["..."],
      // Luganda data
    },
    "scheduleHistory": [
      {
        "title": "WIIKI 1-8",
        "weeks": [...]
      }
    ]
  }
}
```

## Migration Notes

### ⚠️ Important: Do NOT Mix Data
- Never copy data from `meetingSchedule` to `meetingSchedule_Luganda`
- They have different:
  - Section names (MWANDU vs EKIGAMBO)
  - Duration formats (Dak. vs Ddak.)
  - Song formats (Wer vs Oluyimba)
  - Participant names

### Starting Fresh
The Luganda version should start with:
- Empty participant lists
- No schedule history
- Fresh rotation indices

Users will need to:
1. Add their Luganda-speaking participants
2. Import Luganda EPUBs
3. Build schedules from scratch

## Testing Checklist

### Before Deploying Luganda Version:
- [ ] Verify `meetingSchedule_Luganda` path in firebase.js
- [ ] Test save operation - check Firebase Console
- [ ] Confirm data appears under `meetingSchedule_Luganda`
- [ ] Test load operation - loads from correct path
- [ ] Verify Dholuo version still uses `meetingSchedule`
- [ ] Deploy to Vercel
- [ ] Test both sites don't interfere with each other

### After Deployment:
- [ ] Open both sites in different browsers
- [ ] Make changes in Luganda site → verify Dholuo unchanged
- [ ] Make changes in Dholuo site → verify Luganda unchanged
- [ ] Check Firebase Console shows two separate paths

## Vercel Environment

Both sites can share the same environment variables since they use the same Firebase project:

```bash
# .env (same for both deployments)
VITE_FIREBASE_API_KEY=AIzaSyB_VsLZaaQ_m3WNVlPjfhy715BXo8ax004
VITE_FIREBASE_AUTH_DOMAIN=tracking-budget-app.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tracking-budget-app-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=tracking-budget-app
```

The only difference is in the code - the database path.

## Backup Strategy

Since both versions are in the same Firebase project, you can back them up together:

```bash
# Backup entire database (includes both versions)
firebase database:get / > backup-all.json

# Backup just Dholuo
firebase database:get /meetingSchedule > backup-dholuo.json

# Backup just Luganda
firebase database:get /meetingSchedule_Luganda > backup-luganda.json
```

## Future Considerations

### If you need more languages:
```
meetingSchedule              ← Dholuo
meetingSchedule_Luganda      ← Luganda
meetingSchedule_Swahili      ← Future
meetingSchedule_English      ← Future
```

### If you need separate Firebase projects:
Create new projects and update firebase config in each repo separately.

## Summary

✅ **Current Setup (Correct)**
- Same Firebase project
- Different database paths
- No data interference
- Cost-effective
- Easy to manage

This is the perfect solution for your use case! 🎯
