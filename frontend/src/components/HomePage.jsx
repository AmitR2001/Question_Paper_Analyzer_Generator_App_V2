import React, { useState } from 'react';

const HomePage = ({ onNavigate, user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const handleEditProfile = () => {
    onNavigate('profile');
  };

  return (
    <div className="home-page-container">
      {/* Header with user info */}
      <div className="home-nav">
        <div className="nav-brand">
          <h2>🎓 EduAnalyze</h2>
        </div>
        <div className="nav-user">
          <div className="user-dropdown">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-avatar">👤</span>
              <span className="user-name">{user?.username}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-info">
                  <div className="user-details">
                    <strong>{user?.username}</strong>
                    <small>{user?.email}</small>
                  </div>
                </div>
                <hr className="menu-divider" />
                <button 
                  className="menu-item"
                  onClick={handleEditProfile}
                >
                  <span>✏️</span>
                  Edit Profile
                </button>
                <button 
                  className="menu-item logout"
                  onClick={handleLogout}
                >
                  <span>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* main header section */}
      <div className="home-header">
        <h1 className="home-title">
          🎓 Educational Analysis Platform
        </h1>
        <p className="home-subtitle">
          Welcome back, {user?.username}! Choose from our suite of educational analysis tools
        </p>
      </div>

      <div className="options-grid">
        {/* analyzer card - existing functionality */}
        <div className="option-card" onClick={() => onNavigate('analyzer')}>
          <div className="option-icon">🎯</div>
          <h3 className="option-title">Question Difficulty Analyzer</h3>
          <p className="option-description">
            Analyze the difficulty level of question papers based on syllabus and learning objectives
          </p>
          <div className="option-features">
            <span className="feature-tag">📚 Syllabus Analysis</span>
            <span className="feature-tag">📝 Question Evaluation</span>
            <span className="feature-tag">🎯 Objective Matching</span>
          </div>
          <button className="option-button">
            Get Started →
          </button>
        </div>

        {/* generator card - new feature */}
        <div className="option-card" onClick={() => onNavigate('generator')}>
          <div className="option-icon">📄</div>
          <h3 className="option-title">Question Paper Generator</h3>
          <p className="option-description">
            Generate various types of question papers based on syllabus and learning objectives
          </p>
          <div className="option-features">
            <span className="feature-tag">📝 Assignment Questions</span>
            <span className="feature-tag">☑️ MCQ Generator</span>
            <span className="feature-tag">📚 Case Studies</span>
          </div>
          <button className="option-button">
            Generate Papers →
          </button>
        </div>
      </div>

      {/* bottom stats and info section */}
      <div className="home-footer">
        {/* howto guide */}
        <div className="info-section">
          <h4>How it works:</h4>
          <div className="steps-container">
            <div className="step-item">
              <span className="step-number">1</span>
              <span>Choose your analysis tool</span>
            </div>
            <div className="step-item">
              <span className="step-number">2</span>
              <span>Upload your documents</span>
            </div>
            <div className="step-item">
              <span className="step-number">3</span>
              <span>Get instant AI-powered insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="overlay" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
