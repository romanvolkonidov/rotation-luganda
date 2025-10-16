import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

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
  }
  return { app, database, auth };
};

export const saveScheduleToFirebase = async (data, token = null) => {
  if (!database) {
    await initializeFirebase();
  }
  
  // Add token for write access if provided
  const dataWithToken = token ? { ...data, token } : data;
  
  // Use separate path for Luganda version
  const scheduleRef = ref(database, 'meetingSchedule_Luganda');
  await set(scheduleRef, dataWithToken);
};

export const loadScheduleFromFirebase = async () => {
  if (!database) {
    await initializeFirebase();
  }
  
  const dbRef = ref(database);
  // Load from Luganda-specific path
  const snapshot = await get(child(dbRef, 'meetingSchedule_Luganda'));
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    
    // Migration: If data doesn't have a token, it's legacy data
    if (!data.token) {
      console.log('📦 Found legacy data without token - migrating...');
      return { ...data, needsMigration: true };
    }
    
    return data;
  } else {
    return null;
  }
};

// Authentication functions
export const signIn = async (email, password, rememberMe = true) => {
  if (!auth) {
    await initializeFirebase();
  }
  
  if (rememberMe) {
    // Store credentials securely for auto-login
    localStorage.setItem('userEmail', email);
    // Note: In production, use more secure storage for sensitive data
  }
  
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email, password) => {
  if (!auth) {
    await initializeFirebase();
  }
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const autoSignIn = async () => {
  const savedEmail = localStorage.getItem('userEmail');
  if (savedEmail && savedEmail === 'your-email@example.com') { // Replace with your email
    // For single user, you could auto-sign in with saved credentials
    // This is a simplified approach - in production, use proper token management
    return true;
  }
  return false;
};

export const logOut = async () => {
  if (!auth) {
    await initializeFirebase();
  }
  return await signOut(auth);
};

export const getCurrentUser = () => {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
};

export const onAuthChange = (callback) => {
  if (!auth) {
    initializeFirebase();
  }
  return onAuthStateChanged(auth, callback);
};
