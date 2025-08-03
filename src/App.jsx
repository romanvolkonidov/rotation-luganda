import React, { useState, useEffect } from 'react';
import MeetingScheduler from './components/MeetingScheduler';
import AuthForm from './components/AuthForm';
import { initializeFirebase } from './services/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { auth } = await initializeFirebase();
        return onAuthStateChanged(auth, (user) => {
          console.log('Auth state changed:', user ? `User ${user.email}` : 'No user');
          setUser(user);
          setLoading(false);
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };
    
    const unsubscribe = initAuth();
    return () => unsubscribe;
  }, []);

  const handleAuthStateChange = (newUser) => {
    setUser(newUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? (
        <>
          <div className="p-4 bg-gray-100 flex justify-between items-center">
            <span className="text-gray-700">
              Signed in as: {user.email || 'Nyawita'}
            </span>
            <button
              onClick={() => handleAuthStateChange(null)}
              className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
          <MeetingScheduler />
        </>
      ) : (
        <AuthForm onAuthStateChange={handleAuthStateChange} />
      )}
    </div>
  );
}

export default App;
