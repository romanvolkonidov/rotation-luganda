import React, { useState, useEffect } from 'react';
import MeetingScheduler from './components/MeetingScheduler';
import AuthForm from './components/AuthForm';
import { initializeFirebase } from './services/firebase';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { auth } = await initializeFirebase();
      auth.onAuthStateChanged((user) => {
        setUser(user);
      });
    };
    init();
  }, []);

  const handleAuthSuccess = (user) => {
    setUser(user);
  };

  return (
    <div className="App">
      {user ? (
        <MeetingScheduler userId={user.uid} />
      ) : (
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
