import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatRoom from './components/Chat/ChatRoom';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return isLogin ? (
      <Login switchToRegister={() => setIsLogin(false)} />
    ) : (
      <Register switchToLogin={() => setIsLogin(true)} />
    );
  }

  return (
    <>
      <div className="theme-toggle">
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className={`toggle-btn ${theme}`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      <ChatRoom />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;