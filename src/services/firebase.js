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
    auth = getAuth(app);
    
    // Wait for auth state to be ready before initializing database
    await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          console.log('User authenticated:', user.email, 'UID:', user.uid);
        } else {
          console.log('No user authenticated');
        }
        resolve();
      });
      
      // Don't unsubscribe immediately to keep listening for auth changes
      setTimeout(() => unsubscribe(), 1000);
    });

    database = getDatabase(app);
  }
  return { app, database, auth };
};

export const saveScheduleToFirebase = async (data, userId = null) => {
  try {
    if (!database) {
      await initializeFirebase();
    }

    // Get current user ID or use provided ID
    let currentUserId = userId;
    if (!currentUserId) {
      if (!auth?.currentUser) {
        throw new Error('No user is authenticated');
      }
      currentUserId = auth.currentUser.email === 'nyawita@test.com' ? 'hardcoded-user' : auth.currentUser.uid;
    }

    console.log('Saving schedule for user:', currentUserId);
    const scheduleRef = ref(database, `users/${currentUserId}/meetingSchedule`);
    await set(scheduleRef, data);
  } catch (error) {
    console.error('Error saving schedule:', error);
    throw error;
  }
};

export const loadScheduleFromFirebase = async (userId = null) => {
  try {
    if (!database) {
      await initializeFirebase();
    }

    // Get current user ID or use provided ID
    let currentUserId = userId;
    if (!currentUserId) {
      if (!auth?.currentUser) {
        console.error('No user is authenticated');
        return null;
      }
      currentUserId = auth.currentUser.email === 'nyawita@test.com' ? 'hardcoded-user' : auth.currentUser.uid;
    }

    console.log('Loading schedule for user:', currentUserId);
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `users/${currentUserId}/meetingSchedule`));
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log('No schedule found for user:', currentUserId);
      return null;
    }
  } catch (error) {
    console.error('Error loading schedule:', error);
    throw error;
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
  try {
    if (!database) {
      await initializeFirebase();
    }

    // Get current user ID or use provided ID
    let currentUserId = userId;
    if (!currentUserId) {
      if (!auth?.currentUser) {
        console.error('No user is authenticated');
        return null;
      }
      currentUserId = auth.currentUser.email === 'nyawita@test.com' ? 'hardcoded-user' : auth.currentUser.uid;
    }

    console.log('Loading participants for user:', currentUserId);

  // Define default list structure
  const defaultLists = {
    chairmen: { name: 'Chairmen', participants: [] },
    assignment1: { name: 'Assignment 1', participants: [] },
    assignment2: { name: 'Assignment 2', participants: [] },
    assignment3: { name: 'Assignment 3', participants: [] },
    sisters: { name: 'Sisters', participants: [] },
    twak: { name: 'Twak', participants: [] },
    ngimawa: { name: 'Ngimawa (Elders)', participants: [] },
    puonjruok_readers: { name: 'Puonjruok Readers', participants: [] },
    puonjruok_muma: { name: 'Puonjruok Muma', participants: [] },
    prayers: { name: 'Prayers (Lamo)', participants: [] }
  };

  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, `users/${userId}/participants`));
  
  if (snapshot.exists()) {
    const existingLists = snapshot.val();
    // Merge existing lists with default structure to ensure all categories exist
    return Object.keys(defaultLists).reduce((acc, key) => {
      acc[key] = {
        name: defaultLists[key].name,
        participants: existingLists[key]?.participants || []
      };
      return acc;
    }, {});
  } else {
    // For hardcoded user, provide the full participant list
    if (auth?.currentUser?.email === 'nyawita@test.com') {
      return {
        chairmen: { name: 'Chairmen', participants: ['Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak'] },
        assignment1: { name: 'Assignment 1', participants: ['Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak', 'Benson Otieno', 'Steve Ouma', 'Cosmas Were', 'Austin Ngode', 'Caleb Onyango'] },
        assignment2: { name: 'Assignment 2', participants: ['Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak', 'Benson Otieno', 'Steve Ouma', 'Cosmas Were', 'Austin Ngode', 'Caleb Onyango'] },
        assignment3: { name: 'Assignment 3', participants: ['Paul Oduor', 'Roman Volkonidov', 'Wesley Omondi', 'Brian Oduor', 'Eliam Odhiambo', 'John Paul'] },
        sisters: { name: 'Sisters', participants: ['Neriah Ochimbo', 'Ruth Otieno', 'Susan Omondi', 'Benita Ogwel', 'Pheny Achieng', 'Faith Otieno', 'Leah Omollo', 'Saffron Omollo', 'Elcie Natija', 'Irene Oyoo', 'Pendo Oyoo', 'Nyarieko Oyoo', 'Jane Oyombra', 'Millicent Anyango', 'Monique Owiti', 'Rosemary Otieno', 'Jane Gumbo', 'Josephine Otieno', 'Valine Adhiambo', 'Jacklin Otieno', 'Violet Volkonidov', 'Emma Oyugi', 'Everlin Radak', 'Grace Onyango', 'Dorcas Achieng', 'Grace Atieno', 'Consolata Were', 'Winnie Oduor', 'Michell Oduor', 'Monica Nyang\'wera', 'Helen Odwar', 'Caren Akumu', 'Lucy Anyango', 'Vinril Ngode', 'Susan Otieno', 'Everline Atieno', 'Maximilla Auma'] },
        twak: { name: 'Twak', participants: ['Paul Oduor', 'Benedict Olweny', 'George Ochimbo'] },
        ngimawa: { name: 'Ngimawa (Elders)', participants: ['Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak', 'Benson Otieno'] },
        puonjruok_readers: { name: 'Puonjruok Readers', participants: ['Brian Oduor', 'Wesley Omondi', 'Paul Oduor', 'John Paul', 'Eliam Odhiambo'] },
        puonjruok_muma: { name: 'Puonjruok Muma', participants: ['Benson Otieno', 'Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak'] },
        prayers: { name: 'Prayers (Lamo)', participants: ['Steve Ouma', 'Cosmas Were', 'Austin Ngode', 'Caleb Onyango', 'Benedict Olweny', 'Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak', 'Benson Otieno', 'Roman Volkonidov', 'Paul Oduor'] }
      };
    }
    // For new users, return empty lists with all categories
    return defaultLists;
  }
};

// Authentication functions
export const signInWithEmail = async (email, password) => {
  if (!auth) {
    await initializeFirebase();
  }
  
  try {
    let result;
    if (email === 'nyawita@test.com' && password === 'LuoLuo') {
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
