import React, { useState, useRef } from 'react';
import axios from 'axios'; // for api calls
import './QuestionGenerator.css';

const QuestionGenerator = ({ setResult, result, onNavigate }) => {
  // file upload state
  const [syllabus, setSyllabus] = useState(null);
  const [objectives, setObjectives] = useState("");
  const [syllabusTopics, setSyllabusTopics] = useState(""); // optional specific topics
  // q type dropdown
  const [questionType, setQuestionType] = useState("assignment");
  const [difficultyLevel, setDifficultyLevel] = useState("moderate"); // difficulty selector
   const [aiModel, setAiModel] = useState("gemini"); // default ai model - Gemini Pro
  const [loading, setLoading] = useState(false); // loading spinner
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0); // progress bar %
  const [dragActive, setDragActive] = useState(false); // drag n drop
  const [history, setHistory] = useState([]); // prev generations
  const [theme, setTheme] = useState('light'); // ui theme
  const [generationTime, setGenerationTime] = useState(null); // timing perf
  
  const syllabusRef = useRef(null); // ref for file input reset

  // dropdown options for q types
  const questionTypes = [
    { value: 'assignment', label: '📝 Assignment Questions', description: 'Generate comprehensive assignment questions' },
    { value: 'mcq', label: '☑️ MCQ Questions', description: 'Create multiple choice questions' },
     { value: 'casestudy', label: '📚 Case Study Questions', description: 'Develop case study based questions' }
  ];

  // difficulty level options
  const difficultyLevels = [
    { value: 'easy', label: '🟢 Easy', description: 'Basic recall and understanding questions' },
    { value: 'moderate', label: '🟡 Moderate', description: 'Application and analysis questions' },
    { value: 'tough', label: '🔴 Tough', description: 'Complex evaluation and synthesis questions' }
  ];

  // ai model configs - diff providers 
  const aiModels = [
    { value: 'gemini', label: '🔮 Gemini Pro', description: 'Google\'s latest AI model (Default)' },
    { value: 'openrouter', label: '🤖 Claude 3.5 Sonnet (OpenRouter)', description: 'Advanced reasoning and analysis' },
    { value: 'groq', label: '⚡ Llama 3 (Groq)', description: 'Fast and efficient processing' },
    { value: 'openai', label: '🧠 GPT-3.5 Turbo', description: 'OpenAI\'s proven model' }
  ];

  // main form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProgress(0);
    
    const startTime = Date.now(); // track gen time

    try {
      // build form data for multipart upload
      const formData = new FormData();
      formData.append("syllabus", syllabus);
      formData.append("objectives", objectives);
      formData.append("syllabus_topics", syllabusTopics);
      formData.append("question_type", questionType);
      formData.append("difficulty_level", difficultyLevel);
      formData.append("ai_model", aiModel);

      // fake progress updates while waiting for response
      const progressInterval = setInterval(() => {
        setProgress(prev => prev < 90 ? prev + 10 : prev);
      }, 500);

      // send to backend api endpoint
      const res = await axios.post("http://localhost:5000/generate", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted); // real upload progress
        }
      });

      clearInterval(progressInterval); // stop fake progress
      setProgress(100);
      
      // calc how long it took
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      setGenerationTime(duration);
      
      setResult(res.data.questions); // update parent component
      
      // save to history for later viewing
      const newHistoryItem = {
        id: Date.now(), // simple id using timestamp
        timestamp: new Date().toLocaleString(),
        syllabusName: syllabus.name,
        syllabusTopics: syllabusTopics || 'All topics',
        questionType: questionTypes.find(type => type.value === questionType)?.label, // get display name
        difficultyLevel: difficultyLevels.find(level => level.value === difficultyLevel)?.label,
        aiModel: aiModels.find(model => model.value === aiModel)?.label,
        result: res.data.questions,
         duration: duration
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]); // keep only 5 items
      
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
      console.error(err); // log for debugging
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000); // clear progress after delay
    }
  };

  // validate uploaded file is pdf
  const handleFileChange = (setter, file) => {
    if (file && file.type === 'application/pdf') {
      setter(file);
      setError(""); // clear any prev errors
    } else {
      setError("Please select a valid PDF file.");
    }
  };

  // drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true); // show visual feedback
    } else if (e.type === "dragleave") {
       setDragActive(false);
    }
  };

  const handleDrop = (e, setter) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // check if files were dropped
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(setter, e.dataTransfer.files[0]);
    }
  };

  // reset everything back to defaults
  const resetForm = () => {
    setSyllabus(null);
    setObjectives("");
    setSyllabusTopics("");
    setQuestionType("assignment");
    setDifficultyLevel("moderate");
    setAiModel("gemini"); // Reset to Gemini Pro as default
    setError("");
    setResult("");
    setGenerationTime(null);
    if (syllabusRef.current) syllabusRef.current.value = ""; // clear file input
  };

  // export history as json file
  const downloadHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'generation_history.json';
    // create temp download link
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click(); // trigger download
  };

  // result action funcs
  // copy text to user's clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result); // modern clipboard api
      setError("");
      // temp success msg
      const originalError = error;
      setError("✅ Questions copied to clipboard successfully!");
       setTimeout(() => setError(originalError), 3000);
    } catch (err) {
      setError("❌ Failed to copy to clipboard. Please try selecting and copying manually.");
      console.error('Failed to copy: ', err);
    }
  };

  // generate pdf using browser print
  const generatePDF = () => {
    try {
      // open new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError("❌ Popup blocked. Please allow popups for this site.");
        return;
      }
      
      // write html content with inline styles
      printWindow.document.write(`
        <html>
          <head>
            <title>Generated Question Paper</title>
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                 line-height: 1.8; 
                color: #333;
              }
              h1 { 
                color: #2c3e50; 
                border-bottom: 3px solid #3498db; 
                padding-bottom: 10px; 
                text-align: center;
              }
              .header { 
                text-align: center; 
                margin-bottom: 40px; 
                page-break-after: avoid;
              }
              .question { 
                margin: 25px 0; 
                padding: 20px; 
                border-left: 4px solid #3498db; 
                background-color: #f8f9fa;
                page-break-inside: avoid;
              }
              .timestamp { 
                text-align: center; 
                font-size: 11px; 
                color: #7f8c8d; 
                margin-top: 30px; 
                border-top: 1px solid #bdc3c7;
                padding-top: 10px;
              }
              pre { 
                white-space: pre-wrap; 
                font-family: 'Times New Roman', serif; 
                font-size: 12pt;
                line-height: 1.6;
              }
              @media print {
                body { margin: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Question Paper</h1>
              <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Question Type:</strong> ${questionTypes.find(t => t.value === questionType)?.label || questionType}</p>
              <p><strong>Difficulty Level:</strong> ${difficultyLevels.find(d => d.value === difficultyLevel)?.label || difficultyLevel}</p>
              <p><strong>AI Model:</strong> ${aiModels.find(m => m.value === aiModel)?.label || aiModel}</p>
              ${syllabusTopics ? `<p><strong>Focus Topics:</strong> ${syllabusTopics}</p>` : ''}
            </div>
            <div class="content">
              <pre>${result}</pre>
            </div>
            <div class="timestamp">
              Generated using AI Question Paper Generator | ${window.location.hostname}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // trigger print dialog when page loads
      printWindow.onload = function() {
        printWindow.print();
      };
      
      setError("✅ PDF generation window opened. Please complete the print/save process.");
      setTimeout(() => setError(""), 5000);
    } catch (err) {
      setError("❌ Failed to generate PDF. Please try again.");
      console.error('PDF generation error:', err);
    }
  };

  // export as word doc (actually just plain text with .doc ext)
  const exportAsWord = () => {
    try {
      // build doc header with metadata
      const header = `QUESTION PAPER
Generated on: ${new Date().toLocaleString()}
Question Type: ${questionTypes.find(t => t.value === questionType)?.label || questionType}
Difficulty Level: ${difficultyLevels.find(d => d.value === difficultyLevel)?.label || difficultyLevel}
AI Model: ${aiModels.find(m => m.value === aiModel)?.label || aiModel}
${syllabusTopics ? `Focus Topics: ${syllabusTopics}\n` : ''}
================================================================================

`;
      const footer = `

================================================================================
Generated using AI Question Paper Generator
${window.location.hostname}
`;
      
      const content = header + result + footer;
      // create blob for download
      const blob = new Blob([content], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `question_paper_${questionType}_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click(); // trigger dl
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // cleanup
      
      setError("✅ Word document download started!");
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      setError("❌ Failed to export as Word document. Please try copying the text instead.");
      console.error('Word export error:', err);
    }
  };

  // use web share api if available, fallback to pdf
  const shareAsPDF = async () => {
    if (navigator.share) { // check if native sharing supported
      try {
        await navigator.share({
          title: 'AI Generated Question Paper',
          text: `Check out this question paper generated using AI:\n\n${result.substring(0, 200)}...`,
          url: window.location.href
        });
        setError("✅ Shared successfully!");
        setTimeout(() => setError(""), 3000);
      } catch (err) {
        if (err.name !== 'AbortError') { // user didnt cancel
          console.log('Share error:', err);
          generatePDF(); // fallback to pdf
        }
      }
    } else {
      // older browsers dont have web share
      generatePDF();
    }
  };

  return (
    <div className={`upload-form-container ${theme}`}>
      {onNavigate && (
        <div className="back-button-container">
          <button 
            onClick={() => onNavigate('home')}
            className="back-button"
            type="button"
          >
            ← Back to Home
          </button>
        </div>
      )}
      <div className="upload-form-header">
        <h2 className="upload-form-title">
          📄 Question Paper Generator
        </h2>
        
        {/* theme switcher in top right */}
        <div className="upload-form-controls">
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

      {/* error banner at top */}
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

      {/* progress bar shows during generation */}
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
        {/* q type selector cards */}
        <div className="form-group">
          <label className="form-label">
            🎯 Question Type *
          </label>
          <div className="question-type-grid">
            {questionTypes.map((type) => (
              <div 
                key={type.value}
                className={`question-type-card ${questionType === type.value ? 'selected' : ''}`}
                onClick={() => setQuestionType(type.value)}
              >
                <div className="question-type-header">
                  <span className="question-type-label">{type.label}</span>
                  {questionType === type.value && <span className="selected-icon">✓</span>}
                </div>
                <p className="question-type-description">{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* difficulty level selector */}
        <div className="form-group">
          <label className="form-label">
            ⚡ Difficulty Level *
          </label>
          <div className="question-type-grid">
            {difficultyLevels.map((level) => (
              <div 
                key={level.value}
                className={`question-type-card ${difficultyLevel === level.value ? 'selected' : ''}`}
                onClick={() => setDifficultyLevel(level.value)}
              >
                <div className="question-type-header">
                  <span className="question-type-label">{level.label}</span>
                  {difficultyLevel === level.value && <span className="selected-icon">✓</span>}
                </div>
                <p className="question-type-description">{level.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ai model selector */}
        <div className="form-group">
          <label className="form-label">
            🤖 AI Model *
          </label>
          <div className="question-type-grid">
            {aiModels.map((model) => (
              <div 
                key={model.value}
                className={`question-type-card ${aiModel === model.value ? 'selected' : ''}`}
                onClick={() => setAiModel(model.value)}
              >
                <div className="question-type-header">
                  <span className="question-type-label">{model.label}</span>
                  {aiModel === model.value && <span className="selected-icon">✓</span>}
                </div>
                <p className="question-type-description">{model.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* file upload with drag n drop */}
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
            Upload the syllabus PDF file for question generation
          </p>
          {/* show file info when uploaded */}
          {syllabus && (
            <div className="file-success">
              <span className="success-icon">✅</span>
              <span className="file-name">{syllabus.name}</span>
              <span className="file-size">({(syllabus.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {/* text area for objectives input */}
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
              Describe the learning objectives for better question generation
            </p>
            {/* char counter for ux */}
            <span className="character-count">
              {objectives.length} characters
            </span>
          </div>
        </div>

        {/* optional syllabus topics input */}
        <div className="form-group">
          <label htmlFor="syllabusTopics" className="form-label">
            📚 Specific Syllabus Topics (Optional)
          </label>
          <textarea
            id="syllabusTopics"
            placeholder="Enter specific topics you want to focus on (e.g., Data Structures, Algorithms, Database Normalization)..."
            value={syllabusTopics}
            onChange={(e) => setSyllabusTopics(e.target.value)}
            rows={3}
            className="form-textarea"
            aria-describedby="topics-help"
          />
          <div className="textarea-footer">
            <p id="topics-help" className="form-help">
              Leave empty to generate questions from the entire syllabus, or specify particular topics to focus on
            </p>
            <span className="character-count">
              {syllabusTopics.length} characters
            </span>
          </div>
        </div>

        {/* bottom action btns */}
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
            disabled={loading || !syllabus || !objectives || !aiModel || !difficultyLevel}
            className="btn btn-primary"
            aria-describedby="submit-help"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Generating...
              </>
            ) : (
              <>
                📄 Generate Questions
              </>
            )}
          </button>
        </div>
        
        <p id="submit-help" className="form-help text-center">
          Generation typically takes 15-45 seconds
          {generationTime && ` (Last generation: ${generationTime}s)`}
        </p>
      </form>

      {/* actions for generated results */}
      {result && (
        <div className="result-actions-section">
          <div className="result-actions-header">
            <h3 className="result-actions-title">📄 Generated Questions Ready!</h3>
            <p className="result-actions-subtitle">Choose an action below to work with your generated questions:</p>
          </div>
          
          {/* action buttons grid */}
          <div className="result-actions-grid">
            <button 
              onClick={copyToClipboard}
              className="action-btn copy-btn"
              title="Copy all questions to clipboard"
            >
              <div className="action-icon">📋</div>
              <div className="action-content">
                <span className="action-label">Copy Questions</span>
                <span className="action-description">Copy all questions to clipboard</span>
              </div>
            </button>

            <button 
              onClick={shareAsPDF}
              className="action-btn share-btn"
              title="Share as PDF file"
            >
              <div className="action-icon">📤</div>
              <div className="action-content">
                <span className="action-label">Share PDF</span>
                <span className="action-description">Share result as PDF file</span>
              </div>
            </button>

            <button 
              onClick={generatePDF}
              className="action-btn pdf-btn"
              title="Export as PDF"
            >
              <div className="action-icon">📑</div>
              <div className="action-content">
                <span className="action-label">Export PDF</span>
                <span className="action-description">Download as PDF file</span>
              </div>
            </button>

            <button 
              onClick={exportAsWord}
              className="action-btn word-btn"
              title="Export as Word document"
            >
              <div className="action-icon">📝</div>
              <div className="action-content">
                <span className="action-label">Export Word</span>
                <span className="action-description">Download as .doc file</span>
              </div>
            </button>
          </div>
          
          {/* preview section shows first 500 chars */}
          <div className="result-preview">
            <h4 className="preview-title">📋 Question Preview:</h4>
            <div className="preview-content">
              <pre className="question-preview-text">{result.substring(0, 500)}...</pre>
              <div className="preview-stats">
                <span className="stat-item">📊 Length: {result.length} characters</span>
                <span className="stat-item">📝 Generated: {new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* show prev generations if any exist */}
      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3 className="history-title">📈 Recent Generation History</h3>
            <button onClick={downloadHistory} className="btn btn-outline">
              📥 Download History
            </button>
          </div>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-info">
                  <p className="history-files">
                    📚 {item.syllabusName} • {item.questionType} • {item.difficultyLevel}
                  </p>
                  {item.syllabusTopics && item.syllabusTopics !== 'All topics' && (
                    <p className="history-topics">
                      🎯 Topics: {item.syllabusTopics}
                    </p>
                  )}
                  <p className="history-meta">
                    🤖 {item.aiModel} • {item.timestamp} • {item.duration}s
                  </p>
                </div>
                {/* let user load prev results */}
                <button 
                  onClick={() => setResult(item.result)}
                  className="btn btn-sm btn-outline"
                >
                  View Questions
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* help section at bottom */}
      <div className="instructions-section">
        <h3 className="instructions-title">💡 How to use:</h3>
        <div className="instructions-grid">
          <div className="instruction-item">
            <div className="instruction-icon">1️⃣</div>
            <p>Select the type of questions you want to generate</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">2️⃣</div>
            <p>Choose the difficulty level for your questions</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">3️⃣</div>
            <p>Select your preferred AI model</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">4️⃣</div>
            <p>Upload your course syllabus as a PDF file</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">5️⃣</div>
            <p>Enter the learning objectives for your course</p>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">6️⃣</div>
            <p>Optionally specify particular topics to focus on</p>
          </div>
          <div className="instruction-item">
             <div className="instruction-icon">7️⃣</div>
            <p>Click "Generate" to create your question paper</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionGenerator;
