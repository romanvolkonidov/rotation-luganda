import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB_VsLZaaQ_m3WNVlPjfhy715BXo8ax004",
  authDomain: "tracking-budget-app.firebaseapp.com",
  databaseURL: "https://tracking-budget-app-default-rtdb.firebaseio.com/",
  projectId: "tracking-budget-app",
  storageBucket: "tracking-budget-app.appspot.com",
  messagingSenderId: "912992088190",
  appId: "1:912992088190:web:d5ea1a3157722b8feb282f"
};

let app = null;
let database = null;

export const initializeFirebase = async () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  }
  return { app, database };
};

export const saveScheduleToFirebase = async (data) => {
  if (!database) {
    await initializeFirebase();
  }
  
  const scheduleRef = ref(database, 'meetingSchedule');
  await set(scheduleRef, data);
};

export const loadScheduleFromFirebase = async () => {
  if (!database) {
    await initializeFirebase();
  }
  
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, 'meetingSchedule'));
  
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};
