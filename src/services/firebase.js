import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

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

export const initializeFirebase = async () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
    
    // Wait for auth state to be ready
    await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve();
      });
    });
  }
  return { app, database, auth };
};

export const saveScheduleToFirebase = async (data, userId = null) => {
  if (!database) {
    await initializeFirebase();
  }
  
  if (!userId && auth?.currentUser) {
    userId = auth.currentUser.uid;
  }

  // For hardcoded user
  if (auth?.currentUser?.email === 'nyawita@test.com') {
    userId = 'hardcoded-user';
  }

  if (!userId) {
    throw new Error('No user ID available');
  }

  const scheduleRef = ref(database, `users/${userId}/meetingSchedule`);
  await set(scheduleRef, data);
};

export const loadScheduleFromFirebase = async (userId = null) => {
  if (!database) {
    await initializeFirebase();
  }

  if (!userId && auth?.currentUser) {
    userId = auth.currentUser.uid;
  }

  // For hardcoded user
  if (auth?.currentUser?.email === 'nyawita@test.com') {
    userId = 'hardcoded-user';
  }

  if (!userId) {
    throw new Error('No user ID available');
  }

  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, `users/${userId}/meetingSchedule`));
  
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};

// New functions for managing participant lists
export const saveParticipantsToFirebase = async (participants, userId = null) => {
  if (!database) {
    await initializeFirebase();
  }

  if (!userId && auth?.currentUser) {
    userId = auth.currentUser.uid;
  }

  // For hardcoded user
  if (auth?.currentUser?.email === 'nyawita@test.com') {
    userId = 'hardcoded-user';
  }

  if (!userId) {
    throw new Error('No user ID available');
  }

  const participantsRef = ref(database, `users/${userId}/participants`);
  await set(participantsRef, participants);
};

export const loadParticipantsFromFirebase = async (userId = null) => {
  if (!database) {
    await initializeFirebase();
  }

  if (!userId && auth?.currentUser) {
    userId = auth.currentUser.uid;
  }

  // For hardcoded user
  if (auth?.currentUser?.email === 'nyawita@test.com') {
    userId = 'hardcoded-user';
  }

  if (!userId) {
    throw new Error('No user ID available');
  }

  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, `users/${userId}/participants`));
  
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return [];
  }
};

// Authentication functions
export const signInWithEmail = async (email, password) => {
  if (!auth) {
    await initializeFirebase();
  }
  
  try {
    let result;
    if (email === 'nyawita@test.com' && password === 'Luo') {
      // First, create user if doesn't exist
      try {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          // If user exists, sign in
          result = await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw error;
        }
      }
    } else {
      result = await signInWithEmailAndPassword(auth, email, password);
    }
    return result;
  } catch (error) {
    throw error;
  }
};

export const signUpWithEmail = async (email, password) => {
  if (!auth) {
    await initializeFirebase();
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    throw error;
  }
};

export const signInWithGoogle = async () => {
  if (!auth) {
    await initializeFirebase();
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    throw error;
  }
};

export const signOutUser = async () => {
  if (!auth) {
    await initializeFirebase();
  }
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};
