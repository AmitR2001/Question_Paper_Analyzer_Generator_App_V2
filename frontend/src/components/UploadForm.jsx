import React, { useState, useRef } from 'react';
import axios from 'axios';

const UploadForm = ({ setResult }) => {
  const [syllabus, setSyllabus] = useState(null);
  const [questionPdf, setQuestionPdf] = useState(null);
  const [objectives, setObjectives] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState('light');
  // const [language, setLanguage] = useState('en');
  // const [showPreview, setShowPreview] = useState(false); 
  const [analysisTime, setAnalysisTime] = useState(null);
  const [aiModel, setAiModel] = useState('openrouter'); // OpenRouter as default
  
  const syllabusRef = useRef(null);
  const questionRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProgress(0);
    
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("syllabus", syllabus);
      formData.append("question_pdf", questionPdf);
      formData.append("objectives", objectives);
      formData.append("ai_model", aiModel); // Add AI model selection

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => prev < 90 ? prev + 10 : prev);
      }, 500);

      const res = await axios.post("http://localhost:5000/analyze", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      setAnalysisTime(duration);
      
      // Handle both old and new response formats
      let resultData;
      if (res.data.analysis) {
        // New format with analysis and metrics
        resultData = res.data;
      } else if (res.data.result) {
        // Legacy format
        resultData = { analysis: res.data.result, metrics: null, ai_model: aiModel };
      } else {
        resultData = { analysis: "Analysis completed", metrics: null, ai_model: aiModel };
      }
      
      setResult(resultData);
      
      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        syllabusName: syllabus.name,
        questionName: questionPdf.name,
        result: resultData,
        duration: duration,
        aiModel: aiModel
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);
      
    } catch (err) {
      setError("Failed to analyze. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleFileChange = (setter, file) => {
    if (file && file.type === 'application/pdf') {
      setter(file);
      setError("");
    } else {
      setError("Please select a valid PDF file.");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, setter) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(setter, e.dataTransfer.files[0]);
    }
  };

  const resetForm = () => {
    setSyllabus(null);
    setQuestionPdf(null);
    setObjectives("");
    setError("");
    setResult("");
    setAnalysisTime(null);
    if (syllabusRef.current) syllabusRef.current.value = "";
    if (questionRef.current) questionRef.current.value = "";
  };

  const downloadHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'analysis_history.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className={`upload-form-container ${theme}`}>
      <div className="upload-form-header">
        <h2 className="upload-form-title">
          🎯 Question Difficulty Analyzer
        </h2>
        
        <div className="upload-form-controls">
          <select 
            value={aiModel} 
            onChange={(e) => setAiModel(e.target.value)}
            className="ai-model-selector"
            title="Select AI Model"
          >
            <option value="openrouter">⚡ OpenRouter (Claude-4)</option>
            <option value="gemini">🌟 Gemini Pro</option>
            <option value="groq">🚀 Groq (Fast)</option>
            <option value="openai">🤖 OpenAI</option>
            <option value="huggingface">🤗 Hugging Face</option>
          </select>
          
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="theme-selector"
          >
            <option value="light">☀️ Light</option>
            <option value="dark">🌙 Dark</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <div className="error-icon">⚠️</div>
          <div>
            <p className="error-title">Error:</p>
            <p>{error}</p>
          </div>
          <button onClick={() => setError("")} className="error-close">×</button>
        </div>
      )}

      {progress > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="progress-text">{progress}% Complete</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        {/* Syllabus Upload */}
        <div className="form-group">
          <label htmlFor="syllabus" className="form-label">
            📚 Syllabus Document *
          </label>
          <div 
            className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => handleDrop(e, setSyllabus)}
          >
            <input
              ref={syllabusRef}
              id="syllabus"
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(setSyllabus, e.target.files[0])}
              required
              className="file-input"
              aria-describedby="syllabus-help"
            />
            <div className="file-drop-content">
              <div className="file-icon">📄</div>
              <p>Drop syllabus PDF here or click to browse</p>
            </div>
          </div>
          <p id="syllabus-help" className="form-help">
            Upload the syllabus PDF file for analysis
          </p>
          {syllabus && (
            <div className="file-success">
              <span className="success-icon">✅</span>
              <span className="file-name">{syllabus.name}</span>
              <span className="file-size">({(syllabus.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {/* Question Paper Upload */}
        <div className="form-group">
          <label htmlFor="questionPdf" className="form-label">
            📝 Question Paper *
          </label>
          <div 
            className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => handleDrop(e, setQuestionPdf)}
          >
            <input
              ref={questionRef}
              id="questionPdf"
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(setQuestionPdf, e.target.files[0])}
              required
              className="file-input"
              aria-describedby="question-help"
            />
            <div className="file-drop-content">
              <div className="file-icon">📋</div>
              <p>Drop question paper PDF here or click to browse</p>
            </div>
          </div>
          <p id="question-help" className="form-help">
            Upload the question paper PDF to analyze
          </p>
          {questionPdf && (
            <div className="file-success">
              <span className="success-icon">✅</span>
              <span className="file-name">{questionPdf.name}</span>
              <span className="file-size">({(questionPdf.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {/* Learning Objectives */}
        <div className="form-group">
          <label htmlFor="objectives" className="form-label">
            🎯 Learning Objectives *
          </label>
          <textarea
            id="objectives"
            placeholder="Enter the learning objectives or course goals..."
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            required
            rows={4}
            className="form-textarea"
            aria-describedby="objectives-help"
          />
          <div className="textarea-footer">
            <p id="objectives-help" className="form-help">
              Describe the learning objectives for better analysis accuracy
            </p>
            <span className="character-count">
              {objectives.length} characters
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-secondary"
            disabled={loading}
          >
            🔄 Reset Form
          </button>
          
          <button
            type="submit"
            disabled={loading || !syllabus || !questionPdf || !objectives}
            className="btn btn-primary"
            aria-describedby="submit-help"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Analyzing...
              </>
            ) : (
              <>
                🔍 Analyze Question Difficulty
              </>
            )}
          </button>
        </div>
        
        <p id="submit-help" className="form-help text-center">
          Analysis typically takes 10-30 seconds
          {analysisTime && ` (Last analysis: ${analysisTime}s)`}
        </p>
      </form>

      {/* History Section */}
      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3 className="history-title">📈 Recent Analysis History</h3>
            <button onClick={downloadHistory} className="btn btn-outline">
              📥 Download History
            </button>
          </div>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-info">
                  <p className="history-files">
                    📚 {item.syllabusName} + 📝 {item.questionName}
                  </p>
                  <p className="history-meta">
                    {item.timestamp} • {item.duration}s
                  </p>
                </div>
                <button 
                  onClick={() => setResult(item.result)}
                  className="btn btn-sm btn-outline"
                >
                  View Result
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions-section">
        <h3 className="instructions-title">💡 How to use:</h3>
        <div className="instructions-grid">
          <div className="instruction-item">
            <div className="instruction-icon">1️⃣</div>
            <p>Upload your course syllabus as a PDF file</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">2️⃣</div>
            <p>Upload the question paper you want to analyze</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">3️⃣</div>
            <p>Enter the learning objectives for your course</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">4️⃣</div>
            <p>Click "Analyze" to get difficulty assessment</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;