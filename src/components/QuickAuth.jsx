import React, { useState } from 'react';
import { signIn } from '../services/firebase';

const QuickAuth = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // Replace these with your actual credentials
  const YOUR_EMAIL = 'your-email@example.com';
  const YOUR_PASSWORD = 'your-password';

  const handleQuickLogin = async () => {
    setLoading(true);
    try {
      await signIn(YOUR_EMAIL, YOUR_PASSWORD);
      onAuthSuccess();
    } catch (error) {
      console.error('Quick login failed:', error);
      // Fall back to manual login if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h2>Meeting Scheduler</h2>
      <button 
        onClick={handleQuickLogin} 
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Signing in...' : 'Access My Schedule'}
      </button>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        One-click access for the app owner
      </p>
    </div>
  );
};

export default QuickAuth;
