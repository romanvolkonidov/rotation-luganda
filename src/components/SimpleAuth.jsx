import React, { useState, useEffect } from 'react';

const SimpleAuth = ({ onAuthSuccess }) => {
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');

  const SECRET_TOKEN = 'myapp2025'; // Change this to your preferred token
  const DEV_MODE = import.meta.env.VITE_DEVELOPMENT_MODE === 'true';

  useEffect(() => {
    // Auto-login in development mode
    if (DEV_MODE) {
      onAuthSuccess(SECRET_TOKEN);
      return;
    }

    // Check if already authenticated
    const savedToken = localStorage.getItem('app-token');
    if (savedToken === SECRET_TOKEN) {
      onAuthSuccess(savedToken);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (accessToken === SECRET_TOKEN) {
      localStorage.setItem('app-token', accessToken);
      onAuthSuccess(accessToken);
    } else {
      setError('Invalid access token');
    }
  };

  if (DEV_MODE) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          Meeting Scheduler Access
        </h2>
        
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Access Token:
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            placeholder="Enter your access token"
            required
          />
        </div>
        
        <button type="submit" style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}>
          Access App
        </button>
        
        <p style={{ 
          textAlign: 'center', 
          marginTop: '1rem', 
          fontSize: '0.9rem', 
          color: '#666' 
        }}>
          Personal Access Required
        </p>
      </form>
    </div>
  );
};

export default SimpleAuth;
