import React from 'react';

const HomePage = ({ onNavigate }) => {
  return (
    <div className="home-page-container">
      {/* main header section */}
      <div className="home-header">
        <h1 className="home-title">
          🎓 Educational Analysis Platform
        </h1>
        <p className="home-subtitle">
          Choose from our suite of educational analysis tools
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
        {/* fake stats for marketing */}
        <div className="stats-section">
          <div className="stat-item">
            <div className="stat-number">1000+</div>
            <div className="stat-label">Papers Analyzed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">95%</div>
            <div className="stat-label">Accuracy Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Educational Institutions</div>
          </div>
        </div>

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
    </div>
  );
};

export default HomePage;
