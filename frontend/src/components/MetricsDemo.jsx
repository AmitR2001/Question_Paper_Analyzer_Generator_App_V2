import React from 'react';
import ResultCard from './ResultCard';

const MetricsDemo = () => {
  // fake ai result for demo purposes
  const sampleResult = `
Analysis Results:

Difficulty Level: moderate
Alignment Score: 7.5/10

This question paper demonstrates moderate difficulty with good alignment to learning objectives. 

Key Findings:
- Question complexity is appropriate for target level
- Time allocation seems reasonable
- Good mix of theoretical and practical components
- Some questions may need refinement for better discrimination

Recommendations:
- Consider adding more challenging questions for top performers
- Review question 3 for potential ambiguity
- Overall structure is well-balanced
`;

  // mock student response data - q1 is easy mcq
  const sampleStudentData = [
    { question_id: 1, correct: true, time_taken: 42, student_id: 's1' },
    { question_id: 1, correct: false, time_taken: 70, student_id: 's2' },
    { question_id: 1, correct: true, time_taken: 35, student_id: 's3' },
    { question_id: 1, correct: true, time_taken: 28, student_id: 's4' },
    { question_id: 1, correct: false, time_taken: 85, student_id: 's5' },
    { question_id: 1, correct: true, time_taken: 45, student_id: 's6' },
    { question_id: 1, correct: true, time_taken: 38, student_id: 's7' },
    { question_id: 1, correct: false, time_taken: 90, student_id: 's8' },
    { question_id: 1, correct: true, time_taken: 32, student_id: 's9' },
    { question_id: 1, correct: true, time_taken: 41, student_id: 's10' },
    
    // q2 - moderate short answer
    { question_id: 2, correct: false, time_taken: 120, student_id: 's1' },
    { question_id: 2, correct: true, time_taken: 95, student_id: 's2' },
    { question_id: 2, correct: false, time_taken: 110, student_id: 's3' },
    { question_id: 2, correct: true, time_taken: 88, student_id: 's4' },
    { question_id: 2, correct: false, time_taken: 130, student_id: 's5' },
    { question_id: 2, correct: true, time_taken: 92, student_id: 's6' },
    { question_id: 2, correct: false, time_taken: 125, student_id: 's7' },
    { question_id: 2, correct: true, time_taken: 85, student_id: 's8' },
    { question_id: 2, correct: false, time_taken: 135, student_id: 's9' },
    { question_id: 2, correct: true, time_taken: 90, student_id: 's10' },
    
    // q3 - hard essay type
    { question_id: 3, correct: true, time_taken: 180, student_id: 's1' },
    { question_id: 3, correct: false, time_taken: 200, student_id: 's2' },
    { question_id: 3, correct: false, time_taken: 195, student_id: 's3' },
    { question_id: 3, correct: true, time_taken: 175, student_id: 's4' },
    { question_id: 3, correct: false, time_taken: 210, student_id: 's5' },
    { question_id: 3, correct: false, time_taken: 190, student_id: 's6' },
    { question_id: 3, correct: false, time_taken: 205, student_id: 's7' },
    { question_id: 3, correct: true, time_taken: 170, student_id: 's8' },
    { question_id: 3, correct: false, time_taken: 215, student_id: 's9' },
    { question_id: 3, correct: true, time_taken: 165, student_id: 's10' },
    
    // q4 - very easy true/false  
    { question_id: 4, correct: true, time_taken: 25, student_id: 's1' },
    { question_id: 4, correct: true, time_taken: 20, student_id: 's2' },
    { question_id: 4, correct: true, time_taken: 22, student_id: 's3' },
    { question_id: 4, correct: true, time_taken: 18, student_id: 's4' },
    { question_id: 4, correct: true, time_taken: 30, student_id: 's5' },
    { question_id: 4, correct: true, time_taken: 24, student_id: 's6' },
    { question_id: 4, correct: false, time_taken: 45, student_id: 's7' },
    { question_id: 4, correct: true, time_taken: 19, student_id: 's8' },
    { question_id: 4, correct: true, time_taken: 26, student_id: 's9' },
    { question_id: 4, correct: true, time_taken: 21, student_id: 's10' },
    
    // q5 - assignment type
    { question_id: 5, correct: true, time_taken: 300, student_id: 's1' },
    { question_id: 5, correct: false, time_taken: 350, student_id: 's2' },
    { question_id: 5, correct: true, time_taken: 280, student_id: 's3' },
    { question_id: 5, correct: false, time_taken: 380, student_id: 's4' },
    { question_id: 5, correct: true, time_taken: 320, student_id: 's5' },
    { question_id: 5, correct: true, time_taken: 290, student_id: 's6' },
    { question_id: 5, correct: false, time_taken: 400, student_id: 's7' },
    { question_id: 5, correct: true, time_taken: 310, student_id: 's8' },
    { question_id: 5, correct: false, time_taken: 360, student_id: 's9' },
    { question_id: 5, correct: true, time_taken: 295, student_id: 's10' },
    
    // q6 - case study (hardest)
    { question_id: 6, correct: false, time_taken: 450, student_id: 's1' },
    { question_id: 6, correct: true, time_taken: 420, student_id: 's2' },
    { question_id: 6, correct: false, time_taken: 480, student_id: 's3' },
    { question_id: 6, correct: false, time_taken: 500, student_id: 's4' },
    { question_id: 6, correct: true, time_taken: 430, student_id: 's5' },
    { question_id: 6, correct: false, time_taken: 470, student_id: 's6' },
    { question_id: 6, correct: true, time_taken: 410, student_id: 's7' },
    { question_id: 6, correct: false, time_taken: 490, student_id: 's8' },
    { question_id: 6, correct: false, time_taken: 460, student_id: 's9' },
    { question_id: 6, correct: true, time_taken: 440, student_id: 's10' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Question Difficulty Analysis - Metrics Demo</h1>
      <p>
        This demo shows the enhanced ResultCard component with metrics analysis capabilities.
        Switch between 'Standard' and 'Metrics' view using the dropdown in the top right.
      </p>
      
      {/* pass fake data to result card for demo */}
      <ResultCard 
        result={sampleResult}
        studentResponseData={sampleStudentData}
      />
      
      {/* explanation section for users */}
      <div style={{ marginTop: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h2>📊 Metrics Explained</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div>
            <h3>🎯 Difficulty Index (DI)</h3>
            <p>Percentage of students who answered correctly. Higher values indicate easier questions.</p>
            <ul>
              <li><strong>80-100%:</strong> Easy questions</li>
              <li><strong>50-79%:</strong> Moderate difficulty</li>
              <li><strong>0-49%:</strong> Hard questions</li>
            </ul>
          </div>
          
          <div>
            <h3>🔍 Discrimination Index</h3>
            <p>Measures how well a question differentiates between high and low performers.</p>
            <ul>
              <li><strong>30%+:</strong> Excellent discrimination</li>
              <li><strong>20-29%:</strong> Good discrimination</li>
              <li><strong>10-19%:</strong> Fair discrimination</li>
              <li><strong>&lt;10%:</strong> Poor discrimination</li>
            </ul>
          </div>
          
          <div>
            <h3>⏱️ Average Time Taken</h3>
            <p>Average time students spent on each question.</p>
            <ul>
              <li><strong>&lt;60s:</strong> Fast completion</li>
              <li><strong>60-120s:</strong> Normal pace</li>
              <li><strong>&gt;120s:</strong> Slow completion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDemo;
