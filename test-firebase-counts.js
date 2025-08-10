const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Firebase configuration (you'll need to add your config)
const firebaseConfig = {
  // Add your Firebase config here
  // You can find this in your Firebase project settings
};

const testFirebaseParticipantCounts = async () => {
  try {
    console.log('\n=== FIREBASE PARTICIPANT COUNT TEST (Node.js) ===');
    
    const expectedCounts = {
      assignment1: 4,
      assignment2: 5,
      assignment3: 7,
      chairmen: 3,
      ngimawa: 4,
      prayers: 11,
      puonjruok_muma: 3,
      puonjruok_readers: 5,
      sisters: 37,
      twak: 3
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    // Get participant lists from Firebase
    const dataRef = ref(database, 'schedule');
    const snapshot = await get(dataRef);
    
    if (!snapshot.exists()) {
      console.error('❌ No data found in Firebase');
      return;
    }
    
    const data = snapshot.val();
    const participantLists = data.participantLists;
    
    if (!participantLists) {
      console.error('❌ No participant lists found in Firebase');
      return;
    }

    let allCorrect = true;
    Object.entries(expectedCounts).forEach(([listKey, expectedCount]) => {
      const list = participantLists[listKey];
      if (!list) {
        console.error(`❌ List '${listKey}' not found in Firebase`);
        allCorrect = false;
        return;
      }

      const actualCount = list.participants.length;
      const listName = list.name;
      
      if (actualCount === expectedCount) {
        console.log(`✅ ${listName}: ${actualCount} participants (correct)`);
      } else {
        console.error(`❌ ${listName}: ${actualCount} participants (expected ${expectedCount})`);
        allCorrect = false;
      }
    });

    if (allCorrect) {
      console.log('\n🎉 ALL PARTICIPANT COUNTS ARE CORRECT!');
    } else {
      console.log('\n⚠️ Some participant counts are incorrect. Check your Firebase data.');
    }

    // Show detailed lists
    console.log('\n=== DETAILED PARTICIPANT LISTS ===');
    Object.entries(participantLists).forEach(([key, list]) => {
      console.log(`\n${list.name} (${list.participants.length}):`);
      list.participants.forEach((participant, index) => {
        console.log(`  ${index + 1}. ${participant}`);
      });
    });

  } catch (error) {
    console.error('Error testing Firebase:', error);
  }
};

// Run the test
testFirebaseParticipantCounts();
