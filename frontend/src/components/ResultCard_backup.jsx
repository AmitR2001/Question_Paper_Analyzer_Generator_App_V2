import React, { useState, useMemo } from 'react';
import './ResultCard.css';

const ResultCard = ({ result, studentResponseData = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('standard'); // 'standard' or 'metrics'

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

  // Use question-based metrics instead of student response data
  const responseData = useMemo(() => {
    // No longer using student response data - we'll use question-based metrics instead
    return [];
  }, [result]);
  // Calculate metrics using useMemo for performance
  const metrics = useMemo(() => {
    // Use dynamic metrics if available
    if (result && result.metrics) {
      return result.metrics;
    }
    
    // Fallback metrics structure for backward compatibility
    return {
      difficulty_score: 6.5,
      cognitive_level: 'Apply',
      application_depth: 3,
      estimated_time_minutes: 10,
      complexity_index: 7.3,
      syllabus_alignment_score: 8.0,
      concept_density: 3,
      question_type: 'Descriptive',
      topic_weightage_match: '85%',
      marks_vs_effort: 'Balanced',
      difficulty_label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      explanation: 'Analysis completed with basic metrics.',
      ai_model_used: 'unknown'
    };
  }, [responseData, result, difficulty]);

  // Early return after all hooks
  if (!result) return null;

  const getMetricInterpretation = (metric, value) => {
    switch (metric) {
      case 'difficultyIndex':
        if (value >= 80) return { level: 'Easy', color: 'success', icon: '🟢' };
        if (value >= 50) return { level: 'Moderate', color: 'warning', icon: '🟡' };
        return { level: 'Hard', color: 'danger', icon: '🔴' };
      
      case 'discriminationIndex':
        if (value >= 30) return { level: 'Excellent', color: 'success', icon: '⭐' };
        if (value >= 20) return { level: 'Good', color: 'warning', icon: '👍' };
        if (value >= 10) return { level: 'Fair', color: 'neutral', icon: '👌' };
        return { level: 'Poor', color: 'danger', icon: '❌' };
      
      case 'avgTimeTaken':
        if (value <= 60) return { level: 'Fast', color: 'success', icon: '⚡' };
        if (value <= 120) return { level: 'Normal', color: 'warning', icon: '⏱️' };
        return { level: 'Slow', color: 'danger', icon: '🐌' };
      
      default:
        return { level: 'Unknown', color: 'neutral', icon: '❓' };
    }
  };

  // Simple chart component for visualization
  const MetricsChart = ({ data, type }) => {
    const maxValue = type === 'difficultyIndex' ? 100 : 
                    type === 'discriminationIndex' ? 50 : 
                    Math.max(...data.map(d => d[type]));

    return (
      <div className="metrics-chart">
        <div className="chart-header">
          <h4 className="chart-title">
            {type === 'difficultyIndex' && '📊 Difficulty Index (DI)'}
            {type === 'discriminationIndex' && '🎯 Discrimination Index'}
            {type === 'avgTimeTaken' && '⏱️ Average Time Taken'}
          </h4>
        </div>
        <div className="chart-container">
          {data.map((item, index) => {
            const height = (item[type] / maxValue) * 100;
            const interpretation = getMetricInterpretation(type, item[type]);
            
            return (
              <div key={item.questionId} className="chart-bar-container">
                <div className="chart-bar-wrapper">
                  <div 
                    className={`chart-bar ${interpretation.color}`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`Q${item.questionId}: ${item[type]}${type === 'avgTimeTaken' ? 's' : '%'}`}
                  >
                    <span className="bar-value">{item[type]}{type === 'avgTimeTaken' ? 's' : '%'}</span>
                  </div>
                </div>
                <div className="chart-label">Q{item.questionId}</div>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            {type === 'difficultyIndex' && 'Higher = Easier'}
            {type === 'discriminationIndex' && 'Higher = Better Discrimination'}
            {type === 'avgTimeTaken' && 'Time in Seconds'}
          </span>
        </div>
      </div>
    );
  };

  // Scatter plot for DI vs Discrimination Index
  const ScatterPlot = ({ data }) => {
    const maxDI = 100;
    const maxDisc = Math.max(...data.map(d => d.discriminationIndex));
    const minDisc = Math.min(...data.map(d => d.discriminationIndex));
    const discRange = maxDisc - minDisc;

    return (
      <div className="scatter-plot">
        <div className="chart-header">
          <h4 className="chart-title">🔍 DI vs Discrimination Index</h4>
        </div>
        <div className="scatter-container">
          <div className="scatter-plot-area">
            {data.map((item, index) => {
              const x = (item.difficultyIndex / maxDI) * 100;
              const y = discRange > 0 ? ((item.discriminationIndex - minDisc) / discRange) * 100 : 50;
              
              return (
                <div
                  key={item.questionId}
                  className="scatter-point"
                  style={{
                    left: `${x}%`,
                    bottom: `${y}%`
                  }}
                  title={`Q${item.questionId}: DI=${item.difficultyIndex}%, Disc=${item.discriminationIndex}%`}
                >
                  Q{item.questionId}
                </div>
              );
            })}
          </div>
          <div className="scatter-axes">
            <div className="x-axis-label">Difficulty Index (%) →</div>
            <div className="y-axis-label">Discrimination Index (%) ↑</div>
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
                  <h3 className="metrics-title">📊 Question Paper Analytics</h3>
                  <div className="metrics-overview">
                    <div className="overview-stats">
                      <div className="stat-card">
                        <span className="stat-icon">📝</span>
                        <span className="stat-value">{metrics.length}</span>
                        <span className="stat-label">Questions</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">👥</span>
                        <span className="stat-value">{metrics[0]?.totalResponses || 0}</span>
                        <span className="stat-label">Students</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">📈</span>
                        <span className="stat-value">
                          {Math.round(metrics.reduce((sum, m) => sum + m.difficultyIndex, 0) / metrics.length)}%
                        </span>
                        <span className="stat-label">Avg DI</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">⏱️</span>
                        <span className="stat-value">
                          {Math.round(metrics.reduce((sum, m) => sum + m.avgTimeTaken, 0) / metrics.length)}s
                        </span>
                        <span className="stat-label">Avg Time</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="metrics-tables">
                  <div className="metrics-table">
                    <h4 className="table-title">📋 Detailed Metrics</h4>
                    <div className="table-container">
                      <table className="metrics-data-table">
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Difficulty Index</th>
                            <th>Discrimination Index</th>
                            <th>Avg Time</th>
                            <th>Responses</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((metric) => {
                            const diInterpretation = getMetricInterpretation('difficultyIndex', metric.difficultyIndex);
                            const discInterpretation = getMetricInterpretation('discriminationIndex', metric.discriminationIndex);
                            const timeInterpretation = getMetricInterpretation('avgTimeTaken', metric.avgTimeTaken);
                            
                            return (
                              <tr key={metric.questionId}>
                                <td className="question-cell">Q{metric.questionId}</td>
                                <td className={`metric-cell ${diInterpretation.color}`}>
                                  {diInterpretation.icon} {metric.difficultyIndex}%
                                  <br />
                                  <small>{diInterpretation.level}</small>
                                </td>
                                <td className={`metric-cell ${discInterpretation.color}`}>
                                  {discInterpretation.icon} {metric.discriminationIndex}%
                                  <br />
                                  <small>{discInterpretation.level}</small>
                                </td>
                                <td className={`metric-cell ${timeInterpretation.color}`}>
                                  {timeInterpretation.icon} {metric.avgTimeTaken}s
                                  <br />
                                  <small>{timeInterpretation.level}</small>
                                </td>
                                <td className="response-cell">
                                  {metric.correctResponses}/{metric.totalResponses}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="metrics-charts">
                    <div className="charts-grid">
                      <MetricsChart data={metrics} type="difficultyIndex" />
                      <MetricsChart data={metrics} type="discriminationIndex" />
                      <MetricsChart data={metrics} type="avgTimeTaken" />
                      <ScatterPlot data={metrics} />
                    </div>

                    <div className="metrics-insights">
                      <h4 className="insights-title">💡 Key Insights</h4>
                      <div className="insights-list">
                        {(() => {
                          const avgDI = metrics.reduce((sum, m) => sum + m.difficultyIndex, 0) / metrics.length;
                          const avgDisc = metrics.reduce((sum, m) => sum + m.discriminationIndex, 0) / metrics.length;
                          const hardQuestions = metrics.filter(m => m.difficultyIndex < 50).length;
                          const poorDiscrimination = metrics.filter(m => m.discriminationIndex < 10).length;
                          
                          return (
                            <>
                              <div className="insight-item">
                                <span className="insight-icon">📊</span>
                                <span className="insight-text">
                                  Average Difficulty Index: {Math.round(avgDI)}% 
                                  ({avgDI >= 70 ? 'Paper may be too easy' : avgDI <= 40 ? 'Paper may be too hard' : 'Balanced difficulty'})
                                </span>
                              </div>
                              <div className="insight-item">
                                <span className="insight-icon">🎯</span>
                                <span className="insight-text">
                                  Average Discrimination: {Math.round(avgDisc)}% 
                                  ({avgDisc >= 20 ? 'Good discrimination' : 'Poor discrimination - consider revision'})
                                </span>
                              </div>
                              {hardQuestions > 0 && (
                                <div className="insight-item">
                                  <span className="insight-icon">🔴</span>
                                  <span className="insight-text">
                                    {hardQuestions} question(s) are particularly difficult (DI &lt; 50%)
                                  </span>
                                </div>
                              )}
                              {poorDiscrimination > 0 && (
                                <div className="insight-item">
                                  <span className="insight-icon">⚠️</span>
                                  <span className="insight-text">
                                    {poorDiscrimination} question(s) have poor discrimination (DI &lt; 10%) - consider review
                                  </span>
                                </div>
                              )}
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
                  <h3>No Student Response Data Available</h3>
                  <p>To view metrics, student response data is required in the format:</p>
                  <pre className="data-format">
{`[
  {"question_id": 1, "correct": true, "time_taken": 42},
  {"question_id": 2, "correct": false, "time_taken": 70},
  ...
]`}
                  </pre>
                  <p>Currently showing mock data for demonstration.</p>
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