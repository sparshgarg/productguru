import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { User } from './types';
import { getCurrentUser, logoutUser } from './services/mockBackend';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from local storage on mount
  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const refreshUser = () => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-indigo-600">Loading Product Guru...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main>
        {!user ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <Dashboard user={user} onUserUpdate={refreshUser} />
        )}
      </main>
    </div>
  );
};

export default App;
