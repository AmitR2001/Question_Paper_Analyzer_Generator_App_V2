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

  // Use the new metrics format from AI analysis
  const metrics = useMemo(() => {
    if (result && result.all_questions_metrics && result.all_questions_metrics.length > 0) {
      // Multiple questions analyzed - return all metrics
      return result.all_questions_metrics;
    } else if (result && result.metrics) {
      // Single question - wrap in array for consistent rendering
      return [result.metrics];
    }
    
    // For legacy format - create a single data point from the analysis
    const normalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    
    return [{
      difficulty_label: normalizedDifficulty,
      difficulty_score: score || 5.0,
      syllabus_alignment_score: score || 7.0,
      cognitive_level: 'Apply',
      complexity_index: score || 6.0,
      explanation: result.analysis || result,
      ai_model_used: result?.ai_model || 'AI Analysis',
      question_id: 'Q1'
    }];
  }, [result, difficulty, score]);

  // Early return after all hooks
  if (!result) return null;

  // Simple bar chart component
  const BarChart = ({ data, title, metric, color = 'primary' }) => {
    if (!data || data.length === 0) return null;
    
    // Get the actual values for the specific metric
    const values = data.map(item => item[metric] || 0);
    const maxValue = Math.max(...values, 10); // Ensure minimum scale of 10
    
    return (
      <div className="bar-chart">
        <div className="chart-header">
          <h4 className="chart-title">{title}</h4>
        </div>
        <div className="bar-chart-container">
          {data.map((item, index) => {
            const value = item[metric] || 0; // Get the actual value for this specific question
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="bar-item">
                <div className="bar-wrapper">
                  <div 
                    className={`bar ${color}`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${title}: ${value}`}
                  >
                    <span className="bar-value">{value}</span>
                  </div>
                </div>
                <div className="bar-label">
                  {data.length === 1 ? 'Analysis' : `Q${index + 1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Simple pie chart component
  const PieChart = ({ data, title }) => {
    if (!data || data.length === 0) return null;
    
    // Calculate distribution of difficulty levels
    const difficultyDistribution = data.reduce((acc, item) => {
      // Normalize the difficulty label to match our color mapping
      let level = item.difficulty_label || 'Unknown';
      
      // Handle different variations of difficulty labels
      level = level.toLowerCase();
      if (level.includes('easy')) level = 'Easy';
      else if (level.includes('moderate') || level.includes('medium')) level = 'Moderate';
      else if (level.includes('hard') || level.includes('tough') || level.includes('difficult')) level = 'Hard';
      else level = 'Unknown';
      
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    const total = data.length;
    const segments = Object.entries(difficultyDistribution).map(([level, count]) => ({
      label: level,
      value: count,
      percentage: (count / total) * 100
    }));

    // Updated color mapping with more vibrant colors
    const colors = {
      'Easy': '#4CAF50',      // Green
      'Moderate': '#FF9800',   // Orange
      'Hard': '#F44336',       // Red
      'Unknown': '#9E9E9E',    // Grey
      'Tough': '#F44336',      // Red (alias for Hard)
      'Medium': '#FF9800'      // Orange (alias for Moderate)
    };

    let cumulativePercentage = 0;

    return (
      <div className="pie-chart">
        <div className="chart-header">
          <h4 className="chart-title">{title}</h4>
        </div>
        <div className="pie-chart-container">
          <div className="pie-wrapper">
            <svg className="pie-svg" viewBox="0 0 100 100">
              {segments.map((segment, index) => {
                const startAngle = (cumulativePercentage / 100) * 360;
                const endAngle = ((cumulativePercentage + segment.percentage) / 100) * 360;
                cumulativePercentage += segment.percentage;
                
                const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                
                const largeArcFlag = segment.percentage > 50 ? 1 : 0;
                
                const pathData = [
                  `M 50 50`,
                  `L ${x1} ${y1}`,
                  `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');

                // Ensure we have a color for this segment
                const segmentColor = colors[segment.label] || colors['Unknown'];

                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={segmentColor}
                    stroke="#fff"
                    strokeWidth="1"
                    style={{ 
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      transition: 'all 0.3s ease'
                    }}
                  />
                );
              })}
            </svg>
          </div>
          <div className="pie-legend">
            {segments.map((segment, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color"
                  style={{ backgroundColor: colors[segment.label] || colors['Unknown'] }}
                ></div>
                <span className="legend-text">
                  {segment.label}: {segment.value} ({segment.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Generalized metrics summary
  const getGeneralizedMetrics = (data) => {
    if (!data || data.length === 0) return null;
    
    const avgDifficulty = data.reduce((sum, item) => sum + (item.difficulty_score || 0), 0) / data.length;
    const avgAlignment = data.reduce((sum, item) => sum + (item.syllabus_alignment_score || 0), 0) / data.length;
    const avgComplexity = data.reduce((sum, item) => sum + (item.complexity_index || 0), 0) / data.length;
    
    return {
      avgDifficulty: avgDifficulty.toFixed(1),
      avgAlignment: avgAlignment.toFixed(1),
      avgComplexity: avgComplexity.toFixed(1),
      totalQuestions: data.length,
      cognitiveLevel: data[0]?.cognitive_level || 'Apply'
    };
  };

  const generalMetrics = getGeneralizedMetrics(metrics);

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
      generalMetrics: viewMode === 'metrics' ? generalMetrics : null,
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
            {!isExpanded ? (
              /* Summary View - Show only when collapsed */
              <div className="analysis-summary">
                <h3 className="summary-title">📋 Analysis Summary</h3>
                <div className="summary-content">
                  {metrics && metrics.length > 0 ? (
                    <div className="summary-stats">
                      <div className="summary-grid">
                        <div className="summary-item">
                          <span className="summary-icon">📊</span>
                          <div className="summary-details">
                            <span className="summary-label">Questions Analyzed</span>
                            <span className="summary-value">{metrics.length}</span>
                          </div>
                        </div>
                        <div className="summary-item">
                          <span className="summary-icon">🎯</span>
                          <div className="summary-details">
                            <span className="summary-label">Avg Difficulty</span>
                            <span className="summary-value">
                              {(metrics.reduce((sum, item) => sum + (item.difficulty_score || 0), 0) / metrics.length).toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                        <div className="summary-item">
                          <span className="summary-icon">📚</span>
                          <div className="summary-details">
                            <span className="summary-label">Syllabus Alignment</span>
                            <span className="summary-value">
                              {(metrics.reduce((sum, item) => sum + (item.syllabus_alignment_score || 0), 0) / metrics.length).toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                        <div className="summary-item">
                          <span className="summary-icon">🧠</span>
                          <div className="summary-details">
                            <span className="summary-label">Cognitive Level</span>
                            <span className="summary-value">{metrics[0]?.cognitive_level || 'Mixed'}</span>
                          </div>
                        </div>
                        <div className="summary-item">
                          <span className="summary-icon">⏱️</span>
                          <div className="summary-details">
                            <span className="summary-label">Total Time Estimate</span>
                            <span className="summary-value">
                              {(() => {
                                const totalMinutes = metrics.reduce((sum, item) => {
                                  const timeStr = item.estimated_time_to_solve || '15 minutes';
                                  const timeMatch = timeStr.match(/(\d+)/);
                                  return sum + (timeMatch ? parseInt(timeMatch[1]) : 15);
                                }, 0);
                                const hours = Math.floor(totalMinutes / 60);
                                const minutes = totalMinutes % 60;
                                return hours > 0 ? `${hours}h ${minutes}m` : `${totalMinutes}m`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="summary-description">
                        <p className="summary-text">
                          This analysis covers <strong>{metrics.length} question{metrics.length > 1 ? 's' : ''}</strong> with 
                          an average difficulty of <strong>{(metrics.reduce((sum, item) => sum + (item.difficulty_score || 0), 0) / metrics.length).toFixed(1)}/10</strong>. 
                          The questions show <strong>{(metrics.reduce((sum, item) => sum + (item.syllabus_alignment_score || 0), 0) / metrics.length).toFixed(1)}/10</strong> alignment 
                          with the syllabus objectives.
                        </p>
                        <div className="expand-hint">
                          <span className="hint-text">👇 Click expand to view detailed analysis for each question</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="summary-basic">
                      <p className="summary-text">
                        Analysis complete! The question paper has been evaluated for difficulty level, 
                        syllabus alignment, and cognitive complexity.
                      </p>
                      <div className="expand-hint">
                        <span className="hint-text">👇 Click expand to view detailed analysis</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Detailed Analysis - Show only when expanded */
              <div className="detailed-analysis">
                <h3 className="analysis-title">📋 Detailed Question Analysis</h3>
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
            )}
          </div>
        ) : (
          /* Simplified Metrics View with Pie Chart and Bar Graphs */
          <div className="metrics-view">
            {generalMetrics ? (
              <>
                <div className="metrics-summary">
                  <h3 className="metrics-title">📊 Question Analysis Overview</h3>
                  <div className="metrics-overview">
                    <div className="overview-stats">
                      <div className="stat-card">
                        <span className="stat-icon">📊</span>
                        <span className="stat-value">{generalMetrics.avgDifficulty}</span>
                        <span className="stat-label">Avg Difficulty</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">🎯</span>
                        <span className="stat-value">{generalMetrics.avgAlignment}</span>
                        <span className="stat-label">Avg Alignment</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">🔥</span>
                        <span className="stat-value">{generalMetrics.avgComplexity}</span>
                        <span className="stat-label">Avg Complexity</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">📝</span>
                        <span className="stat-value">{generalMetrics.totalQuestions}</span>
                        <span className="stat-label">Total Questions</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="charts-container">
                  <div className="charts-row">
                    <div className="chart-item">
                      <PieChart 
                        data={metrics} 
                        title="📊 Difficulty Distribution" 
                      />
                    </div>
                    
                    <div className="chart-item">
                      <BarChart 
                        data={metrics} 
                        title="📊 Difficulty Scores" 
                        metric="difficulty_score"
                        color="primary"
                      />
                    </div>
                  </div>
                  
                  <div className="charts-row">
                    <div className="chart-item">
                      <BarChart 
                        data={metrics} 
                        title="🎯 Syllabus Alignment" 
                        metric="syllabus_alignment_score"
                        color="success"
                      />
                    </div>
                    
                    <div className="chart-item">
                      <BarChart 
                        data={metrics} 
                        title="🎯 Application Depth" 
                        metric="complexity_index"
                        color="warning"
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="metrics-insights">
                    <h4 className="insights-title">💡 Key Insights</h4>
                    <div className="insights-list">
                      <div className="insight-item">
                        <span className="insight-icon">📊</span>
                        <span className="insight-text">
                          Average difficulty score: <strong>{generalMetrics.avgDifficulty}/10</strong>
                        </span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-icon">🎯</span>
                        <span className="insight-text">
                          Average syllabus alignment: <strong>{generalMetrics.avgAlignment}/10</strong>
                        </span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-icon">🧠</span>
                        <span className="insight-text">
                          Primary cognitive level: <strong>{generalMetrics.cognitiveLevel}</strong>
                        </span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-icon">🔥</span>
                        <span className="insight-text">
                          Average complexity: <strong>{generalMetrics.avgComplexity}/10</strong>
                        </span>
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
                    <div className="metric-item">🎯 <strong>Application Depth</strong> - How deep application knowledge is required (1-5 scale)</div>
                  </div>
                  <p><em>Visual charts will display once analysis is complete.</em></p>
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