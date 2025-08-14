import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';

// Your Firebase config (same as in firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyB_VsLZaaQ_m3WNVlPjfhy715BXo8ax004",
  authDomain: "tracking-budget-app.firebaseapp.com",
  databaseURL: "https://tracking-budget-app-default-rtdb.firebaseio.com/",
  projectId: "tracking-budget-app",
  storageBucket: "tracking-budget-app.appspot.com",
  messagingSenderId: "912992088190",
  appId: "1:912992088190:web:d5ea1a3157722b8feb282f"
};

async function migrateData() {
  console.log('🔄 Starting data migration...');
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  
  try {
    // Load existing data
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'meetingSchedule'));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Check if already has token
      if (data.token) {
        console.log('✅ Data already has token - no migration needed');
        return;
      }
      
      // Add token to existing data
      const migratedData = {
        ...data,
        token: 'myapp2025', // Your token
        migratedAt: new Date().toISOString()
      };
      
      // Save back to Firebase
      const scheduleRef = ref(database, 'meetingSchedule');
      await set(scheduleRef, migratedData);
      
      console.log('✅ Data migration completed successfully!');
      console.log('📊 Migrated data includes:');
      console.log('- Participant Lists:', !!data.participantLists);
      console.log('- Previous Assignments:', !!data.previousAssignments);
      console.log('- Schedule History:', !!data.scheduleHistory);
      console.log('- Rotation Indices:', !!data.rotationIndices);
      
    } else {
      console.log('ℹ️ No existing data found - nothing to migrate');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateData();
