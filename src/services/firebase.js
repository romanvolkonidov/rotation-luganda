import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';

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
let auth = null;
const googleProvider = new GoogleAuthProvider();

export const initializeFirebase = async () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
  }
  return { app, database, auth };
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

const initializeNewUserData = async (userId) => {
  const defaultLists = {
    chairmen: [],
    prayers: [],
    readers: [],
    microphones: [],
    zoom: [],
    attendance: [],
    platformAttendants: []
  };

  const userRef = ref(database, `users/${userId}`);
  await set(userRef, defaultLists);
};

export const signInWithEmail = async (email, password) => {
  if (!auth) {
    await initializeFirebase();
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signUpWithEmail = async (email, password) => {
  if (!auth) {
    await initializeFirebase();
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await initializeNewUserData(userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithGoogle = async () => {
  if (!auth) {
    await initializeFirebase();
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if this is a new user
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      await initializeNewUserData(user.uid);
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};
