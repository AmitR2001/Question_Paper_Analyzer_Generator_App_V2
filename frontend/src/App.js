import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import UploadForm from './components/UploadForm';
import QuestionGenerator from './components/QuestionGenerator';
import ResultCard from './components/ResultCard';
import Login from './components/Login';
import Registration from './components/Registration';
import Profile from './components/Profile';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // routing state
  const [currentPage, setCurrentPage] = useState('home');
  const [result, setResult] = useState(null); // shared result data

  // Check if user is already logged in on app load
  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Handle successful login
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentPage('home'); // Navigate to home after login
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('home');
    setResult(null);
    localStorage.removeItem('user');
  };

  // simple navigation handler
  const handleNavigation = (page) => {
    setCurrentPage(page);
    setResult(null); // reset when switching pages
  };

  // Handle navigation from login/registration pages
  const handleAuthNavigation = (page) => {
    setCurrentPage(page);
  };

  // Handle user profile update
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Show login or registration page if not authenticated
  if (!isAuthenticated) {
    switch(currentPage) {
      case 'register':
        return (
          <div className="app-container">
            <Registration onNavigate={handleAuthNavigation} />
          </div>
        );
      case 'login':
      default:
        return (
          <div className="app-container">
            <Login onLogin={handleLogin} onNavigate={handleAuthNavigation} />
          </div>
        );
    }
  }

  // page renderer based on current route (only for authenticated users)
  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigation} user={user} onLogout={handleLogout} />;
      case 'profile':
        return <Profile user={user} onNavigate={handleNavigation} onUserUpdate={handleUserUpdate} />;
      case 'analyzer':
        return (
          <div className="analyzer-page">
            <UploadForm setResult={setResult} onNavigate={handleNavigation} />
            {result && <ResultCard result={result} />}
          </div>
        );
      case 'generator':
        return (
          <div className="generator-page">
            <QuestionGenerator setResult={setResult} result={result} onNavigate={handleNavigation} />
            {/* show results below generator */}
            {result && <ResultCard result={result} />}
          </div>
        );
      default:
        return <HomePage onNavigate={handleNavigation} user={user} onLogout={handleLogout} />; // fallback
    }
  };

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  );
}

export default App;