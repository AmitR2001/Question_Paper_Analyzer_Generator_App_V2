import React, { useState } from 'react';
import HomePage from './components/HomePage';
import UploadForm from './components/UploadForm';
import QuestionGenerator from './components/QuestionGenerator';
import ResultCard from './components/ResultCard';

function App() {
  // routing state
  const [currentPage, setCurrentPage] = useState('home');
  const [result, setResult] = useState(null); // shared result data

  // simple navigation handler
  const handleNavigation = (page) => {
    setCurrentPage(page);
    setResult(null); // reset when switching pages
  };

  // page renderer based on current route
  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigation} />;
      case 'analyzer':
        return (
          <div className="analyzer-page">
            <div className="page-header">
              <button 
                onClick={() => handleNavigation('home')}
                className="back-button"
              >
                ← Back to Home
              </button>
            </div>
            <UploadForm setResult={setResult} />
            {result && <ResultCard result={result} />}
          </div>
        );
      case 'generator':
        return (
          <div className="generator-page">
            <div className="page-header">
              <button 
                onClick={() => handleNavigation('home')}
                className="back-button"
              >
                ← Back to Home
              </button>
            </div>
            <QuestionGenerator setResult={setResult} result={result} />
            {/* show results below generator */}
            {result && <ResultCard result={result} />}
          </div>
        );
      default:
        return <HomePage onNavigate={handleNavigation} />; // fallback
    }
  };

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  );
}

export default App;