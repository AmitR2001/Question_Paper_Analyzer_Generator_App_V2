import React, { useState, useMemo } from 'react';
import './ResultCard.css';

const ResultCard = ({ result, studentResponseData = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('standard'); // 'standard' or 'metrics'
  const [selectedChartMetric, setSelectedChartMetric] = useState('difficulty_score');

  // Move all hooks to the top, before any early returns
  const difficulty = useMemo(() => {
    if (!result) return 'moderate';
    
    // Handle new format with analysis property
    const analysisText = result.analysis || result;
    
    const parseDifficulty = (text) => {
      // Extract difficulty level from result text - more flexible patterns
      const patterns = [
        /difficulty[:\s]+(easy|moderate|tough|hard)/i,
        /(easy|moderate|tough|hard)\s+difficulty/i,
        /level[:\s]+(easy|moderate|tough|hard)/i,
        /\b(easy|moderate|tough|hard)\b/i
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1].toLowerCase();
        }
      }
      return 'moderate'; // Default fallback
    };
    
    return parseDifficulty(analysisText);
  }, [result]);

  const score = useMemo(() => {
    if (!result) return null;
    
    // Handle new format with analysis property
    const analysisText = result.analysis || result;
    
    const parseScore = (text) => {
      // Extract numerical score from result text - more flexible patterns
      const patterns = [
        /score[:\s]+(\d+(?:\.\d+)?)/i,
        /alignment[:\s]+(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*\/\s*10/i,
        /(\d+(?:\.\d+)?)\s*out\s*of\s*10/i,
        /rating[:\s]+(\d+(?:\.\d+)?)/i
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return parseFloat(match[1]);
        }
      }
      return null;
    };
    
    return parseScore(analysisText);
  }, [result]);

  const timestamp = new Date().toLocaleString();

  // Use the new metrics format from AI analysis
  const metrics = useMemo(() => {
    if (result && result.all_questions_metrics && result.all_questions_metrics.length > 0) {
      // Multiple questions analyzed - return all metrics
      return result.all_questions_metrics;
    } else if (result && result.metrics) {
      // Single question - wrap in array for consistent rendering
      return [result.metrics];
    }
    
    // Fallback for legacy format - create mock metrics for demonstration
    return [{
      difficulty_label: difficulty || 'Moderate',
      difficulty_score: score || 6.5,
      syllabus_alignment_score: score || 8.5,
      cognitive_level: 'Apply',
      application_depth: 3,
      estimated_time_to_solve: '15 minutes',
      complexity_index: 7.2,
      explanation: 'This question requires application of concepts with moderate complexity.',
      ai_model_used: result?.ai_model || 'AI Analysis',
      question_id: 'Q1'
    }];
  }, [result, difficulty, score]);

  // Early return after all hooks
  if (!result) return null;

  const getMetricInterpretation = (metric, value) => {
    switch (metric) {
      case 'difficulty_score':
        if (value <= 3) return { level: 'Easy', color: 'success', icon: '' };
        if (value <= 7) return { level: 'Moderate', color: 'warning', icon: '' };
        return { level: 'Hard', color: 'danger', icon: '' };
      
      case 'application_depth':
        if (value <= 2) return { level: 'Basic', color: 'success', icon: '' };
        if (value <= 3) return { level: 'Intermediate', color: 'warning', icon: '' };
        return { level: 'Advanced', color: 'danger', icon: '' };
      
      case 'complexity_index':
        if (value <= 4) return { level: 'Simple', color: 'success', icon: '' };
        if (value <= 7) return { level: 'Moderate', color: 'warning', icon: '' };
        return { level: 'Complex', color: 'danger', icon: '' };
      
      case 'syllabus_alignment_score':
        if (value >= 8) return { level: 'Excellent', color: 'success', icon: '' };
        if (value >= 6) return { level: 'Good', color: 'warning', icon: '' };
        return { level: 'Poor', color: 'danger', icon: '' };
      
      default:
        return { level: 'Unknown', color: 'neutral', icon: '❓' };
    }
  };

  // Simple chart component for visualization
  const MetricsChart = ({ data, type }) => {
    if (!data || data.length === 0) return null;
    
    const getChartData = () => {
      switch (type) {
        case 'difficulty_score':
          return { title: '📊 Difficulty Score', max: 10, unit: '', color: 'primary' };
        case 'application_depth':
          return { title: '🎯 Application Depth', max: 5, unit: '', color: 'success' };
        case 'complexity_index':
          return { title: '🧠 Complexity Index', max: 10, unit: '', color: 'warning' };
        case 'syllabus_alignment_score':
          return { title: '📚 Syllabus Alignment', max: 10, unit: '', color: 'info' };
        default:
          return { title: 'Unknown Metric', max: 10, unit: '', color: 'neutral' };
      }
    };

    const chartData = getChartData();
    
    // Get average interpretation for legend
    const avgValue = data.reduce((sum, item) => sum + (item[type] || 0), 0) / data.length;
    const avgInterpretation = getMetricInterpretation(type, avgValue);
    
    return (
      <div className="metrics-chart">
        <div className="chart-header">
          <h4 className="chart-title">{chartData.title}</h4>
        </div>
        <div className="chart-container">
          {data.map((item, index) => {
            const value = item[type] || 0;
            const height = (value / chartData.max) * 100;
            const interpretation = getMetricInterpretation(type, value);
            
            return (
              <div key={index} className="chart-bar-container">
                <div className="chart-bar-wrapper">
                  <div 
                    className={`chart-bar ${interpretation.color}`}
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`${chartData.title}: ${value}${chartData.unit}`}
                  >
                    <span className="bar-value">{value}{chartData.unit}</span>
                  </div>
                </div>
                <div className="chart-label">{item.question_id || `Q${index + 1}`}</div>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            {avgInterpretation.icon} Average: {avgInterpretation.level}
          </span>
        </div>
      </div>
    );
  };

  // Radar chart for overall metrics visualization
  const MetricsRadar = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    const metric = data[0];
    const radarMetrics = [
      { name: 'Difficulty', value: metric.difficulty_score || 0, max: 10 },
      { name: 'Alignment', value: metric.syllabus_alignment_score || 0, max: 10 },
      { name: 'Depth', value: metric.application_depth || 0, max: 5 },
      { name: 'Complexity', value: metric.complexity_index || 0, max: 10 }
    ];

    return (
      <div className="metrics-radar">
        <div className="radar-header">
          <h4 className="radar-title">🎯 Question Analysis Overview</h4>
        </div>
        <div className="radar-container">
          {radarMetrics.map((item, index) => {
            const percentage = (item.value / item.max) * 100;
            return (
              <div key={index} className="radar-metric">
                <div className="radar-label">{item.name}</div>
                <div className="radar-bar">
                  <div 
                    className="radar-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="radar-value">{item.value}/{item.max}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Cognitive Level Display Component
  const CognitiveLevelDisplay = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    const metric = data[0];
    const cognitiveLevel = metric.cognitive_level || 'Apply';
    
    const levelColors = {
      'Remember': { color: '#e3f2fd', text: '#1565c0' },
      'Understand': { color: '#f3e5f5', text: '#7b1fa2' },
      'Apply': { color: '#e8f5e8', text: '#2e7d32' },
      'Analyze': { color: '#fff3e0', text: '#f57c00' },
      'Evaluate': { color: '#fce4ec', text: '#c2185b' },
      'Create': { color: '#f1f8e9', text: '#558b2f' }
    };
    
    const levelStyle = levelColors[cognitiveLevel] || levelColors['Apply'];

    return (
      <div className="cognitive-level-display">
        <div className="chart-header">
          <h4 className="chart-title">🧠 Bloom's Taxonomy Level</h4>
        </div>
        <div className="cognitive-level-container">
          <div 
            className="cognitive-level-badge"
            style={{ 
              backgroundColor: levelStyle.color, 
              color: levelStyle.text,
              border: `2px solid ${levelStyle.text}20`
            }}
          >
            <div className="level-icon">
              {cognitiveLevel === 'Remember' && '📚'}
              {cognitiveLevel === 'Understand' && '💡'}
              {cognitiveLevel === 'Apply' && '🔧'}
              {cognitiveLevel === 'Analyze' && '🔍'}
              {cognitiveLevel === 'Evaluate' && '⚖️'}
              {cognitiveLevel === 'Create' && '🎨'}
            </div>
            <div className="level-text">
              <div className="level-name">{cognitiveLevel}</div>
              <div className="level-description">
                {cognitiveLevel === 'Remember' && 'Recall facts and basic concepts'}
                {cognitiveLevel === 'Understand' && 'Explain ideas or concepts'}
                {cognitiveLevel === 'Apply' && 'Use information in new situations'}
                {cognitiveLevel === 'Analyze' && 'Draw connections among ideas'}
                {cognitiveLevel === 'Evaluate' && 'Justify decisions or courses of action'}
                {cognitiveLevel === 'Create' && 'Produce new or original work'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Debug logging (remove in production)
  console.log('AI Result:', result);
  console.log('Parsed Difficulty:', difficulty);
  console.log('Parsed Score:', score);

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy': return 'success';
      case 'moderate': return 'warning';
      case 'tough': 
      case 'hard': return 'danger';
      case 'unknown': return 'neutral';
      default: return 'neutral';
    }
  };

  const getDifficultyIcon = (level) => {
    switch (level) {
      case 'easy': return '🟢';
      case 'moderate': return '🟡';
      case 'tough': 
      case 'hard': return '🔴';
      case 'unknown': return '❓';
      default: return '⚪';
    }
  };

  const exportResult = () => {
    const exportData = {
      timestamp,
      difficulty,
      score,
      fullResult: result,
      analysisText: result.analysis || result,
      metrics: viewMode === 'metrics' ? metrics : null,
      aiModel: result.ai_model || 'unknown',
      analysis: {
        generatedAt: timestamp,
        version: '1.0',
        viewMode
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analysis_result_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.analysis || result);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Question Difficulty Analysis',
        text: `Analysis Result: ${difficulty.toUpperCase()} difficulty${score ? ` (Score: ${score}/10)` : ''}`,
        url: window.location.href
      });
    }
  };

  return (
    <div className={`result-card ${theme}`}>
      <div className="result-header">
        <div className="result-title-section">
          <h2 className="result-title">
            🎯 Analysis Result
          </h2>
          <div className="result-meta">
            <span className="result-timestamp">📅 {timestamp}</span>
          </div>
        </div>
        
        <div className="result-controls">
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            className="view-mode-selector"
          >
            <option value="standard">📊 Standard</option>
            <option value="metrics">📈 Metrics</option>
          </select>
          
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="theme-selector-small"
          >
            <option value="light">☀️</option>
            <option value="dark">🌙</option>
          </select>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="expand-btn"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '🔽' : '🔼'}
          </button>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="result-summary">
        <div className={`difficulty-badge ${getDifficultyColor(difficulty)}`}>
          <span className="difficulty-icon">{getDifficultyIcon(difficulty)}</span>
          <span className="difficulty-text">{difficulty.toUpperCase()}</span>
        </div>
        
        {score && (
          <div className="score-display">
            <div className="score-circle">
              <div className="score-value">{score}</div>
              <div className="score-label">/ 10</div>
            </div>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${(score / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`result-content ${isExpanded ? 'expanded' : ''}`}>
        {viewMode === 'standard' ? (
          <div className="result-text">
            <div className="formatted-result">
              {(result.analysis || result).split('\n').map((line, index) => (
                <p key={index} className="result-line">
                  {line.trim() && (
                    <>
                      {line.includes(':') ? (
                        <>
                          <strong>{line.split(':')[0]}:</strong>
                          {line.split(':').slice(1).join(':')}
                        </>
                      ) : (
                        line
                      )}
                    </>
                  )}
                </p>
              ))}
            </div>
          </div>
        ) : (
          /* Metrics View */
          <div className="metrics-view">
            {metrics && metrics.length > 0 ? (
              <>
                <div className="metrics-summary">
                  <h3 className="metrics-title">📊 Question Difficulty Analytics</h3>
                  <div className="metrics-overview">
                    <div className="overview-stats">
                      <div className="stat-card">
                        <span className="stat-icon">�</span>
                        <span className="stat-value">{metrics[0]?.difficulty_score || 0}</span>
                        <span className="stat-label">Difficulty Score</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">🎯</span>
                        <span className="stat-value">{metrics[0]?.syllabus_alignment_score || 0}</span>
                        <span className="stat-label">Alignment Score</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">🔥</span>
                        <span className="stat-value">{metrics[0]?.complexity_index || 0}/10</span>
                        <span className="stat-label">Complexity Index</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">⏱️</span>
                        <span className="stat-value">{metrics[0]?.estimated_time_to_solve || '15 min'}</span>
                        <span className="stat-label">Est. Time</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="metrics-tables">
                  <div className="metrics-table">
                    <h4 className="table-title">📋 Detailed Question Analysis</h4>
                    <div className="table-container">
                      <table className="metrics-data-table">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th>Value</th>
                            <th>Level</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((metric, index) => {
                            const difficultyInterpretation = getMetricInterpretation('difficulty_score', metric.difficulty_score);
                            const alignmentInterpretation = getMetricInterpretation('syllabus_alignment_score', metric.syllabus_alignment_score);
                            const complexityInterpretation = getMetricInterpretation('complexity_index', metric.complexity_index);
                            
                            return (
                              <React.Fragment key={index}>
                                <tr className="question-separator">
                                  <td colSpan="4" className="question-number">
                                    <strong>📝 Question {index + 1}</strong>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="metric-name">📊 Difficulty Score</td>
                                  <td className={`metric-value ${difficultyInterpretation.color}`}>
                                    {metric.difficulty_score}/10
                                  </td>
                                  <td className={`metric-level ${difficultyInterpretation.color}`}>
                                    {difficultyInterpretation.icon} {difficultyInterpretation.level}
                                  </td>
                                  <td className="metric-description">Overall question difficulty</td>
                                </tr>
                                <tr>
                                  <td className="metric-name">🎯 Syllabus Alignment</td>
                                  <td className={`metric-value ${alignmentInterpretation.color}`}>
                                    {metric.syllabus_alignment_score}/10
                                  </td>
                                  <td className={`metric-level ${alignmentInterpretation.color}`}>
                                    {alignmentInterpretation.icon} {alignmentInterpretation.level}
                                  </td>
                                  <td className="metric-description">How well aligned with syllabus</td>
                                </tr>
                                <tr>
                                  <td className="metric-name">⏱️ Estimated Time</td>
                                  <td className="metric-value">
                                    {metric.estimated_time_to_solve}
                                  </td>
                                  <td className="metric-level">
                                    ⏰ Duration
                                    {/* ⏰ Duration */}
                                  </td>
                                  <td className="metric-description">Time needed to solve</td>
                                </tr>
                                <tr>
                                  <td className="metric-name"> Complexity Index</td>
                                  {/* <td className="metric-name">🔥 Complexity Index</td> */}
                                  <td className={`metric-value ${complexityInterpretation.color}`}>
                                    {metric.complexity_index}/10
                                  </td>
                                  <td className={`metric-level ${complexityInterpretation.color}`}>
                                    {complexityInterpretation.icon} {complexityInterpretation.level}
                                  </td>
                                  <td className="metric-description">Overall complexity measure</td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="metrics-charts">
                    <div className="charts-section">
                      <div className="chart-controls">
                        <h4 className="charts-title">📈 Interactive Metrics Visualization</h4>
                        <div className="metric-selector">
                          <label htmlFor="metric-dropdown">Select Metric to Visualize:</label>
                          <select 
                            id="metric-dropdown" 
                            className="metric-dropdown"
                            value={selectedChartMetric}
                            onChange={(e) => setSelectedChartMetric(e.target.value)}
                          >
                            <option value="difficulty_score">📊 Difficulty Score</option>
                            <option value="syllabus_alignment_score">🎯 Syllabus Alignment</option>
                            <option value="complexity_index">🔥 Complexity Index</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="selected-chart">
                        <MetricsChart data={metrics} type={selectedChartMetric} />
                      </div>
                    </div>
                    
                    <div className="charts-grid">
                      <div className="grid-title">
                        <h4>📊 All Metrics Overview</h4>
                        <p>Comprehensive view of all question metrics</p>
                      </div>
                      <div className="chart-grid-container">
                        <MetricsChart data={metrics} type="difficulty_score" />
                        <MetricsChart data={metrics} type="application_depth" />
                        <MetricsChart data={metrics} type="complexity_index" />
                        <MetricsChart data={metrics} type="syllabus_alignment_score" />
                      </div>
                      <CognitiveLevelDisplay data={metrics} />
                    </div>
                    
                    <div className="radar-section">
                      <MetricsRadar data={metrics} />
                    </div>

                    <div className="metrics-insights">
                      <h4 className="insights-title">💡 Key Insights</h4>
                      <div className="insights-list">
                        {(() => {
                          if (!metrics || metrics.length === 0) return null;
                          const metric = metrics[0];
                          
                          return (
                            <>
                              <div className="insight-item">
                                <span className="insight-icon">📊</span>
                                <span className="insight-text">
                                  This question has a difficulty score of {metric.difficulty_score}/10, 
                                  categorized as <strong>{metric.difficulty_label}</strong>
                                </span>
                              </div>
                              <div className="insight-item">
                                <span className="insight-icon">🎯</span>
                                <span className="insight-text">
                                  Syllabus alignment score is {metric.syllabus_alignment_score}/10, 
                                  indicating {metric.syllabus_alignment_score >= 8 ? 'excellent' : 
                                            metric.syllabus_alignment_score >= 6 ? 'good' : 'poor'} alignment
                                </span>
                              </div>
                              <div className="insight-item">
                                <span className="insight-icon">🧠</span>
                                <span className="insight-text">
                                  Requires <strong>{metric.cognitive_level}</strong> level thinking according to Bloom's Taxonomy
                                </span>
                              </div>
                              <div className="insight-item">
                                <span className="insight-icon">⏱️</span>
                                <span className="insight-text">
                                  Estimated solving time: <strong>{metric.estimated_time_to_solve}</strong>
                                </span>
                              </div>
                              <div className="insight-item">
                                <span className="insight-icon">🔥</span>
                                <span className="insight-text">
                                  Complexity index of {metric.complexity_index}/10 suggests a 
                                  {metric.complexity_index <= 4 ? ' simple' : 
                                   metric.complexity_index <= 7 ? ' moderately complex' : ' highly complex'} question
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-metrics">
                <div className="no-metrics-content">
                  <span className="no-metrics-icon">📊</span>
                  <h3>Question Metrics Available</h3>
                  <p>This system provides comprehensive question difficulty analysis including:</p>
                  <div className="metrics-list">
                    <div className="metric-item">📊 <strong>Difficulty Score</strong> - Overall question difficulty (1-10)</div>
                    <div className="metric-item">🎯 <strong>Syllabus Alignment</strong> - How well aligned with course content</div>
                    <div className="metric-item">🧠 <strong>Cognitive Level</strong> - Bloom's Taxonomy classification</div>
                    <div className="metric-item">🔧 <strong>Application Depth</strong> - Level of practical application required</div>
                    <div className="metric-item">⏱️ <strong>Estimated Time</strong> - Expected solving duration</div>
                    <div className="metric-item">🔥 <strong>Complexity Index</strong> - Combined complexity measure</div>
                  </div>
                  <p><em>These metrics focus on question characteristics rather than student performance data.</em></p>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'standard' && isExpanded && (
          <div className="result-details">
            <div className="detail-section">
              <h4 className="detail-title">📊 Analysis Breakdown</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Difficulty Level:</span>
                  <span className="detail-value">{difficulty.toUpperCase()}</span>
                </div>
                {score && (
                  <div className="detail-item">
                    <span className="detail-label">Alignment Score:</span>
                    <span className="detail-value">{score}/10</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Analysis Time:</span>
                  <span className="detail-value">{timestamp}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Word Count:</span>
                  <span className="detail-value">{(result.analysis || result).split(' ').length} words</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="detail-title">🏷️ Tags</h4>
              <div className="tags-container">
                <span className="tag">{difficulty}</span>
                {score && <span className="tag">Score: {score}</span>}
                <span className="tag">AI Analysis</span>
                <span className="tag">Educational</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="result-actions">
        <button 
          onClick={copyToClipboard}
          className="action-btn action-btn-copy"
          title="Copy to clipboard"
        >
          📋 Copy
        </button>
        
        <button 
          onClick={exportResult}
          className="action-btn action-btn-export"
          title="Export as JSON"
        >
          💾 Export
        </button>
        
        <button 
          onClick={shareResult}
          className="action-btn action-btn-share"
          title="Share result"
        >
          📤 Share
        </button>
        
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="action-btn action-btn-details"
          title="Toggle details"
        >
          {showDetails ? '🔍 Less' : '🔍 More'}
        </button>
      </div>

      {/* Additional Details */}
      {showDetails && (
        <div className="additional-details">
          <div className="raw-result">
            <h4 className="detail-title">📝 Raw Analysis</h4>
            <pre className="raw-text">{result.analysis || result}</pre>
          </div>
          
          {result.ai_model && (
            <div className="ai-model-info">
              <h4 className="detail-title">🤖 AI Model Used</h4>
              <span className="ai-model-badge">{result.ai_model}</span>
            </div>
          )}
          
          <div className="analysis-stats">
            <h4 className="detail-title">📈 Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{(result.analysis || result).length}</span>
                <span className="stat-label">Characters</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{(result.analysis || result).split(' ').length}</span>
                <span className="stat-label">Words</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{(result.analysis || result).split('\n').filter(line => line.trim()).length}</span>
                <span className="stat-label">Lines</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{((result.analysis || result).split(' ').length / 200).toFixed(1)}</span>
                <span className="stat-label">Min Read</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="result-footer">
        <p className="footer-text">
          Generated by AI Question Difficulty Analyzer • 
          <span className="footer-link" onClick={() => window.location.reload()}>
            🔄 Analyze Another
          </span>
        </p>
      </div>
    </div>
  );
};

export default ResultCard;