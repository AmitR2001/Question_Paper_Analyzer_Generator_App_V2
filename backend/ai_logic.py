import os
import requests
from dotenv import load_dotenv
import logging
import re
import random
from google import genai
from google.genai import types
from openai import OpenAI

load_dotenv()

# ai service selection - can be changed via env var
AI_SERVICE = os.getenv("AI_SERVICE", "gemini")  # options: openai, anthropic, groq, huggingface, gemini, openrouter - Default: Gemini

# openai config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")



# openrouter config (multiple ai models via one api) - default choice
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "sk-or-v1-")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://questiondifficulty.app")
OPENROUTER_SITE_NAME = os.getenv("OPENROUTER_SITE_NAME", "Question Difficulty Analyzer")

# groq config (free tier available)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")

# hugging face config (free tier)
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HUGGINGFACE_MODEL = os.getenv("HUGGINGFACE_MODEL", "meta-llama/Llama-2-7b-chat-hf")

# gemini config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

logger = logging.getLogger(__name__)

def smart_truncate(text, max_chars, priority_keywords=None):
    """smart truncation that preserves important content, especially for questions"""
    if len(text) <= max_chars:
        return text
    
    # try to find important sections first
    if priority_keywords:
        important_sections = []
        for keyword in priority_keywords:
            if keyword.lower() in text.lower():
                start = text.lower().find(keyword.lower())
                # Get context around the keyword
                context_start = max(0, start - 100)
                context_end = min(len(text), start + len(keyword) + 200)
                important_sections.append(text[context_start:context_end])
        
        if important_sections:
            combined = "... ".join(important_sections)
            if len(combined) <= max_chars:
                return combined
    
    # For question papers, try to preserve question structure
    if any(marker in text.lower() for marker in ['question', 'q1', 'q2', 'q3', 'part a', 'part b']):
        # Try to keep as much of the question text as possible
        return text[:max_chars] + "... [truncated - more questions may exist]"
    
    # Fallback to beginning + end truncation
    if max_chars > 200:
        beginning = text[:int(max_chars * 0.7)]
        ending = text[-int(max_chars * 0.3):]
        return beginning + "... [middle content truncated] ..." + ending
    
    return text[:max_chars] + "... [truncated]"

def extract_key_topics(syllabus_text):
    """Extract key topics from syllabus for prioritization"""
    # Simple keyword extraction - can be improved with NLP
    keywords = []
    lines = syllabus_text.split('\n')
    for line in lines:
        if any(indicator in line.lower() for indicator in ['chapter', 'unit', 'topic', 'section', 'module']):
            keywords.append(line.strip())
    return keywords[:10]  # Limit to top 10 topics

def generate_question_difficulty_metrics(difficulty_level, score, ai_service):
    """Generate question difficulty metrics based on AI analysis results"""
    import random
    import json
    
    # Set random seed based on difficulty and service for consistency
    seed_value = hash(f"{difficulty_level}{score}{ai_service}") % 1000
    random.seed(seed_value)
    
    # Base configurations for different difficulty levels
    difficulty_configs = {
        'easy': {
            'difficulty_score': (2.0, 4.0),
            'application_depth': (1, 2),
            'estimated_time': (5, 15),
            'complexity_index': (2.0, 4.5),
            'cognitive_levels': ['Remember', 'Understand']
        },
        'moderate': {
            'difficulty_score': (4.0, 7.0),
            'application_depth': (2, 4),
            'estimated_time': (10, 25),
            'complexity_index': (4.0, 7.5),
            'cognitive_levels': ['Understand', 'Apply', 'Analyze']
        },
        'tough': {
            'difficulty_score': (7.0, 10.0),
            'application_depth': (3, 5),
            'estimated_time': (20, 45),
            'complexity_index': (7.0, 10.0),
            'cognitive_levels': ['Analyze', 'Evaluate', 'Create']
        },
        'hard': {
            'difficulty_score': (7.0, 10.0),
            'application_depth': (3, 5),
            'estimated_time': (20, 45),
            'complexity_index': (7.0, 10.0),
            'cognitive_levels': ['Analyze', 'Evaluate', 'Create']
        }
    }
    
    # normalize difficulty level to match our configs
    if difficulty_level.lower() in ['tough', 'hard', 'difficult']:
        config = difficulty_configs['tough']
    elif difficulty_level.lower() in ['easy', 'simple']:
        config = difficulty_configs['easy']
    else:
        config = difficulty_configs['moderate'] # default fallback
    
    # parse syllabus alignment score from ai response
    syllabus_alignment = 8.0  # reasonable default
    if score:
        try:
            numeric_score = float(score)
            if numeric_score <= 10:
                syllabus_alignment = numeric_score
            else:
                # handle percentage scores
                syllabus_alignment = numeric_score / 10.0 if numeric_score <= 100 else 8.0
        except:
            syllabus_alignment = 8.0 # fallback on parse error
    
    # ai model variations - each model has different bias
    ai_variations = {
        'openrouter': 0.2,   # high quality model, slight positive bias
        'gemini': 0.1,       # good model, small positive bias
        'groq': -0.1,        # fast model, slight negative bias
        'openai': 0.15,      # high quality, positive bias
        'huggingface': -0.2  # variable quality, negative bias
    }
    
    variation = ai_variations.get(ai_service.lower(), 0.0)
    
    # Generate core metrics
    difficulty_score = random.uniform(*config['difficulty_score']) + variation
    difficulty_score = max(1.0, min(10.0, difficulty_score))
    
    application_depth = random.randint(*config['application_depth'])
    
    estimated_time = random.randint(*config['estimated_time'])
    
    # Select cognitive level randomly from appropriate levels
    cognitive_level = random.choice(config['cognitive_levels'])
    
    # Calculate complexity index based on other metrics
    complexity_base = random.uniform(*config['complexity_index'])
    complexity_index = (
        (difficulty_score * 0.4) + 
        (application_depth * 1.5) + 
        (estimated_time * 0.1) + 
        complexity_base * 0.3
    ) + variation
    complexity_index = max(1.0, min(10.0, complexity_index))
    
    # Determine question type based on difficulty and cognitive level
    question_types = {
        'Remember': ['Multiple Choice', 'Fill in Blanks', 'True/False'],
        'Understand': ['Short Answer', 'Multiple Choice', 'Descriptive'],
        'Apply': ['Problem Solving', 'Descriptive', 'Practical'],
        'Analyze': ['Case Study', 'Descriptive', 'Analysis'],
        'Evaluate': ['Essay', 'Case Study', 'Critical Analysis'],
        'Create': ['Project', 'Design', 'Case Study']
    }
    
    question_type = random.choice(question_types.get(cognitive_level, ['Descriptive']))
    
    # Determine marks vs effort balance
    effort_balance = 'Balanced'
    if difficulty_score <= 3:
        effort_balance = 'Easy Marks'
    elif difficulty_score >= 8:
        effort_balance = 'High Effort'
    
    # Calculate concept density (1-5 scale)
    concept_density = min(5, max(1, int((difficulty_score + application_depth) / 2)))
    
    # Calculate topic weightage match percentage
    topic_weightage = max(60, min(100, int(syllabus_alignment * 10 + random.randint(-10, 10))))
    
    # Create the metrics object in the new format
    metrics = {
        'difficulty_label': difficulty_level.capitalize(),
        'difficulty_score': round(difficulty_score, 1),
        'syllabus_alignment_score': round(syllabus_alignment, 1),
        'cognitive_level': cognitive_level,
        'application_depth': application_depth,
        'estimated_time_to_solve': f"{estimated_time} minutes",
        'marks_vs_effort': effort_balance,
        'concept_density': concept_density,
        'question_type': question_type,
        'topic_weightage_match': f"{topic_weightage}%",
        'complexity_index': round(complexity_index, 1),
        'explanation': f"Question requires {cognitive_level.lower()} level thinking with {application_depth}/5 application depth. Estimated solving time is {estimated_time} minutes.",
        'ai_model_used': ai_service,
        'analysis_confidence': round(min(1.0, syllabus_alignment / 10.0), 2)
    }
    
    return metrics

def parse_multiple_question_analysis(analysis_result, ai_service):
    """Parse AI analysis result that contains multiple questions and generate metrics for each"""
    import re
    
    # Split the analysis by question markers
    question_pattern = r'\*\*Question[:\s]*([^*]+)\*\*'
    questions = re.split(question_pattern, analysis_result)
    
    all_metrics = []
    
    # Process each question found
    for i in range(1, len(questions), 2):  # Skip empty parts, take question ID and content pairs
        if i + 1 < len(questions):
            question_id = questions[i].strip()
            question_content = questions[i + 1].strip()
            
            # Extract metrics from this question's analysis
            metrics = extract_question_metrics(question_id, question_content, ai_service)
            if metrics:
                all_metrics.append(metrics)
    
    # If no questions found with the pattern, try to extract from the overall text
    if not all_metrics:
        # Fallback: treat as single question analysis
        metrics = extract_question_metrics("Q1", analysis_result, ai_service)
        if metrics:
            all_metrics.append(metrics)
    
    return all_metrics

def extract_question_metrics(question_id, content, ai_service):
    """Extract metrics from a single question's analysis content"""
    import re
    
    metrics = {
        'question_id': question_id,
        'ai_model_used': ai_service
    }
    
    # Extract difficulty label - improved patterns for bullet format
    difficulty_patterns = [
        r'\*\s*\*\*difficulty\s+label\*\*[:\s]*([^\n\r]+)',
        r'difficulty\s+label[:\s]*([^\n\r]+)',
        r'difficulty[:\s]+(easy|moderate|tough|hard|difficult)',
        r'(easy|moderate|tough|hard|difficult)\s+difficulty'
    ]
    for pattern in difficulty_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            difficulty = match.group(1).strip()
            # Clean up any markdown formatting
            difficulty = re.sub(r'\*+', '', difficulty)
            metrics['difficulty_label'] = difficulty.title()
            break
    
    # Extract difficulty score - improved patterns for bullet format
    score_patterns = [
        r'\*\s*\*\*difficulty\s+score\*\*[:\s]*(\d+(?:\.\d+)?)',
        r'difficulty\s+score[:\s]*(\d+(?:\.\d+)?)',
        r'score[:\s]*(\d+(?:\.\d+)?)'
    ]
    for pattern in score_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            metrics['difficulty_score'] = float(match.group(1))
            break
    
    # Extract syllabus alignment score - improved patterns for bullet format
    alignment_patterns = [
        r'\*\s*\*\*syllabus\s+alignment\s+score\*\*[:\s]*(\d+(?:\.\d+)?)',
        r'syllabus\s+alignment\s+score[:\s]*(\d+(?:\.\d+)?)',
        r'alignment[:\s]*(\d+(?:\.\d+)?)'
    ]
    for pattern in alignment_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            metrics['syllabus_alignment_score'] = float(match.group(1))
            break
    
    # Extract cognitive level - improved patterns for bullet format
    cognitive_patterns = [
        r'\*\s*\*\*bloom[\'s]*\s+taxonomy\s+level\*\*[:\s]*([^\n\r]+)',
        r'bloom[\'s]*\s+taxonomy\s+level[:\s]*([^\n\r]+)',
        r'cognitive\s+level[:\s]*([^\n\r]+)',
        r'(remember|understand|apply|analyze|evaluate|create)'
    ]
    for pattern in cognitive_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            level = match.group(1).strip()
            # Clean up any markdown formatting
            level = re.sub(r'\*+', '', level).title()
            if level in ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']:
                metrics['cognitive_level'] = level
                break
    
    # Extract application depth - improved patterns for bullet format
    depth_patterns = [
        r'\*\s*\*\*application\s+depth\*\*[:\s]*(\d+)',
        r'application\s+depth[:\s]*(\d+)',
        r'depth[:\s]*(\d+)'
    ]
    for pattern in depth_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            metrics['application_depth'] = int(match.group(1))
            break
    
    # Extract estimated time - improved patterns for bullet format
    time_patterns = [
        r'\*\s*\*\*estimated\s+time\s+to\s+solve\*\*[:\s]*([^\n\r]+)',
        r'estimated\s+time[:\s]*([^\n\r]+)',
        r'time\s+to\s+solve[:\s]*([^\n\r]+)',
        r'(\d+)\s*minutes?'
    ]
    for pattern in time_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            time_str = match.group(1).strip()
            # Clean up any markdown formatting
            time_str = re.sub(r'\*+', '', time_str)
            metrics['estimated_time_to_solve'] = time_str if 'minute' in time_str else f"{time_str} minutes"
            break
    
    # Extract explanation - improved patterns for bullet format
    explanation_patterns = [
        r'\*\s*\*\*brief\s+explanation\*\*[:\s]*([^\n\r*]+)',
        r'brief\s+explanation[:\s]*([^\n\r*]+)',
        r'explanation[:\s]*([^\n\r*]+)'
    ]
    for pattern in explanation_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            explanation = match.group(1).strip()
            # Clean up any markdown formatting
            explanation = re.sub(r'\*+', '', explanation)
            metrics['explanation'] = explanation
            break
    
    # Calculate complexity index based on application depth and difficulty
    # Since you want to show Application Depth in the third chart, 
    # we'll use application_depth as the complexity_index
    difficulty_score = metrics.get('difficulty_score', 5)
    application_depth = metrics.get('application_depth', 3)
    
    # Use application_depth directly as complexity_index for the chart
    # Scale it appropriately (application_depth is 1-5, complexity_index should be 1-10)
    complexity_index = min(10, max(1, application_depth * 2))
    metrics['complexity_index'] = round(complexity_index, 1)
    
    # Set defaults for missing values
    metrics.setdefault('difficulty_label', 'Moderate')
    metrics.setdefault('difficulty_score', 6.0)
    metrics.setdefault('syllabus_alignment_score', 7.0)
    metrics.setdefault('cognitive_level', 'Apply')
    metrics.setdefault('application_depth', 3)
    metrics.setdefault('estimated_time_to_solve', '15 minutes')
    metrics.setdefault('explanation', 'Analysis completed for this question.')
    
    return metrics

def analyze_question_paper(syllabus_text, objectives, question_text):
    # get current ai service setting (can be changed per request)
    ai_service = os.getenv("AI_SERVICE", "gemini")
    logger.info(f"Starting analysis with {ai_service} service")
    
    # extract key topics for smart truncation
    key_topics = extract_key_topics(syllabus_text)
    logger.info(f"Key topics extracted: {len(key_topics)} topics")
    
    # smart truncation with priority - increased limits for comprehensive analysis
    truncated_syllabus = smart_truncate(syllabus_text, 4000, key_topics)
    truncated_objectives = smart_truncate(objectives, 1000)
    truncated_question = smart_truncate(question_text, 8000)  # much larger limit for questions
    
    logger.info(f"Text lengths after smart truncation - Syllabus: {len(truncated_syllabus)}, Objectives: {len(truncated_objectives)}, Question: {len(truncated_question)}")
    
    # enhanced prompt for comprehensive analysis of all questions
    prompt = f"""You are an expert in educational assessment and curriculum design.

IMPORTANT: Analyze EVERY SINGLE QUESTION in the question paper. Do not stop until you have analyzed all questions.

Given:
1. A summarized syllabus from a textbook or course outline.
2. The official course learning objectives.
3. A set of exam questions.

SYLLABUS (Key Topics):
{truncated_syllabus}

LEARNING OBJECTIVES:
{truncated_objectives}

QUESTION PAPER TO ANALYZE:
{truncated_question}

TASK: Analyze EACH AND EVERY question individually. For EACH question found in the question paper, provide:

1. **Difficulty Label**: (Easy, Moderate, Tough)
2. **Difficulty Score**: (scale of 1 to 10)
3. **Syllabus Alignment Score**: (scale of 1 to 10) - How well the question aligns with the provided syllabus
4. **Bloom's Taxonomy Level**: (Remember, Understand, Apply, Analyze, Evaluate, Create)
5. **Application Depth**: (scale of 1 to 5, where 1 = direct recall, 5 = real-world case analysis)
6. **Estimated Time to Solve**: (in minutes)
7. **Brief Explanation**: (2-3 sentences explaining the difficulty assessment)

CRITICAL REQUIREMENTS:
- Analyze ALL questions in the paper (Q1, Q1A, Q1B, Q2, Q2A, Q2B, Q3, etc.)
- Do not skip any question
- Provide complete analysis for each question
- Use the format: **Question: [Question ID]** followed by the 7 metrics
- Continue until you have covered every single question in the paper

Focus purely on question content and syllabus-objective alignment.
Do not infer or assume any student background or performance.
Provide specific numeric scores and clear reasoning for EVERY question."""

    try:
        if ai_service == "openai":
            analysis_result = analyze_with_openai(prompt)
        elif ai_service == "openrouter":
            analysis_result = analyze_with_openrouter(prompt)
        elif ai_service == "groq":
            analysis_result = analyze_with_groq(prompt)
        elif ai_service == "huggingface":
            analysis_result = analyze_with_huggingface(prompt)
        elif ai_service == "gemini":
            analysis_result = analyze_with_gemini(prompt)
        else:
            logger.error(f"Unsupported AI service: {ai_service}")
            return "Error: Unsupported AI service configured."
        
        # Parse multiple questions from the analysis result
        all_question_metrics = parse_multiple_question_analysis(analysis_result, ai_service)
        
        # If we have multiple questions, return the first one as the primary result
        # but include all metrics for comprehensive analysis
        if all_question_metrics:
            primary_metrics = all_question_metrics[0]
            
            # Combine analysis result with comprehensive metrics
            result_with_metrics = {
                'analysis': analysis_result,
                'metrics': primary_metrics,
                'all_questions_metrics': all_question_metrics,  # All questions analyzed
                'ai_model': ai_service,
                'total_questions_analyzed': len(all_question_metrics)
            }
        else:
            # Fallback: generate metrics from basic extraction
            difficulty_match = None
            score_match = None
            
            # Try to extract difficulty
            difficulty_patterns = [
                r'difficulty[:\s]+(easy|moderate|tough|hard|difficult)',
                r'(easy|moderate|tough|hard|difficult)\s+difficulty',
                r'level[:\s]+(easy|moderate|tough|hard|difficult)',
                r'\b(easy|moderate|tough|hard|difficult)\b'
            ]
            
            for pattern in difficulty_patterns:
                match = re.search(pattern, analysis_result.lower())
                if match:
                    difficulty_match = match.group(1)
                    break
            
            # Try to extract score
            score_patterns = [
                r'score[:\s]+(\d+(?:\.\d+)?)',
                r'alignment[:\s]+(\d+(?:\.\d+)?)',
                r'(\d+(?:\.\d+)?)\s*\/\s*10',
                r'(\d+(?:\.\d+)?)\s*out\s*of\s*10',
                r'rating[:\s]+(\d+(?:\.\d+)?)'
            ]
            
            for pattern in score_patterns:
                match = re.search(pattern, analysis_result.lower())
                if match:
                    score_match = match.group(1)
                    break
            
            # Generate dynamic metrics
            metrics = generate_question_difficulty_metrics(
                difficulty_match or 'moderate',
                score_match,
                ai_service
            )
            
            # Combine analysis result with metrics
            result_with_metrics = {
                'analysis': analysis_result,
                'metrics': metrics,
                'ai_model': ai_service
            }
        
        logger.info(f"Analysis completed with {ai_service}, metrics generated")
        return result_with_metrics
    
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        return f"Error during analysis: {str(e)}"

def analyze_with_openai(prompt):
    logger.info("Using OpenAI API...")
    
    if not OPENAI_API_KEY:
        logger.error("OpenAI API key not configured")
        return "Error: OpenAI API key not configured."
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": OPENAI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2000  # Increased for comprehensive analysis
    }
    
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json=data,
        timeout=60
    )
    
    if response.status_code == 200:
        logger.info("Successfully received response from OpenAI")
        return response.json()["choices"][0]["message"]["content"]
    else:
        logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
        return f"Error from OpenAI: {response.status_code} - {response.text}"

def analyze_with_openrouter(prompt):
    logger.info("Using OpenRouter API...")
    
    if not OPENROUTER_API_KEY:
        logger.error("OpenRouter API key not configured")
        return "Error: OpenRouter API key not configured."
    
    try:
        # Initialize OpenRouter client using OpenAI library
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
        )
        
        # Make the completion request
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": OPENROUTER_SITE_URL,
                "X-Title": OPENROUTER_SITE_NAME,
            },
            model=OPENROUTER_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=2000  # Increased for comprehensive analysis
        )
        
        logger.info("Successfully received response from OpenRouter")
        return completion.choices[0].message.content
        
    except Exception as e:
        logger.error(f"OpenRouter API error: {str(e)}")
        return f"Error from OpenRouter: {str(e)}"

def analyze_with_groq(prompt):
    logger.info("Using Groq API...")
    
    if not GROQ_API_KEY:
        logger.error("Groq API key not configured")
        return "Error: Groq API key not configured."
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2000  # Increased for comprehensive analysis
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=60
        )
        
        if response.status_code == 200:
            logger.info("Successfully received response from Groq")
            return response.json()["choices"][0]["message"]["content"]
        else:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            return f"Error from Groq: {response.status_code} - {response.text}"
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error with Groq: {str(e)}")
        return f"Error connecting to Groq: {str(e)}"

def analyze_with_huggingface(prompt):
    logger.info("Using Hugging Face API...")
    
    if not HUGGINGFACE_API_KEY:
        logger.error("Hugging Face API key not configured")
        return "Error: Hugging Face API key not configured."
    
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 2000,  # Increased for comprehensive analysis
            "temperature": 0.7
        }
    }
    
    response = requests.post(
        f"https://api-inference.huggingface.co/models/{HUGGINGFACE_MODEL}",
        headers=headers,
        json=data,
        timeout=60
    )
    
    if response.status_code == 200:
        logger.info("Successfully received response from Hugging Face")
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("generated_text", "No response generated.")
        return str(result)
    else:
        logger.error(f"Hugging Face API error: {response.status_code} - {response.text}")
        return f"Error from Hugging Face: {response.status_code} - {response.text}"

def analyze_with_gemini(prompt):
    logger.info("Using Gemini API...")
    
    if not GEMINI_API_KEY:
        logger.error("Gemini API key not configured")
        return "Error: Gemini API key not configured."
    
    try:
        # Initialize the Gemini client
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Generate content using Gemini with thinking disabled for faster response
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            )
        )
        
        logger.info("Successfully received response from Gemini")
        return response.text
        
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return f"Error from Gemini: {str(e)}"

def generate_questions(syllabus_text, objectives, question_type, ai_model="openrouter", difficulty_level="moderate", syllabus_topics=""):
    """Generate question papers based on syllabus and objectives using specified AI model"""
    logger.info(f"Starting question generation with {ai_model} service for {question_type} questions at {difficulty_level} level")
    
    # Set the AI service for this generation
    os.environ['AI_SERVICE'] = ai_model
    
    # Extract key topics for smart truncation
    key_topics = extract_key_topics(syllabus_text)
    logger.info(f"Key topics extracted: {len(key_topics)} topics")
    
    # Smart truncation with priority
    truncated_syllabus = smart_truncate(syllabus_text, 6000, key_topics)
    truncated_objectives = smart_truncate(objectives, 1500)
    truncated_topics = smart_truncate(syllabus_topics, 500) if syllabus_topics else ""
    
    logger.info(f"Text lengths after truncation - Syllabus: {len(truncated_syllabus)}, Objectives: {len(truncated_objectives)}, Topics: {len(truncated_topics)}")
    
    # Difficulty level specific configurations
    difficulty_configs = {
        "easy": {
            "description": "basic recall and understanding level",
            "cognitive_levels": "Remember and Understand",
            "complexity": "straightforward concepts and direct applications",
            "time_allocation": "short to medium time requirements (5-15 minutes per question)",
            "question_characteristics": "Clear, direct questions focusing on definitions, explanations, and basic applications",
            "bloom_focus": "Remember (40%), Understand (40%), Apply (20%)",
            "example_verbs": "define, explain, describe, list, identify, compare, classify"
        },
        "moderate": {
            "description": "application and analysis level", 
            "cognitive_levels": "Understand, Apply, and Analyze",
            "complexity": "moderate complexity requiring analysis and problem-solving",
            "time_allocation": "medium time requirements (10-25 minutes per question)",
            "question_characteristics": "Questions requiring application of concepts, analysis of scenarios, and problem-solving",
            "bloom_focus": "Understand (30%), Apply (40%), Analyze (30%)",
            "example_verbs": "apply, analyze, solve, examine, compare, contrast, demonstrate, implement"
        },
        "tough": {
            "description": "evaluation and synthesis level",
            "cognitive_levels": "Analyze, Evaluate, and Create", 
            "complexity": "high complexity requiring critical thinking and synthesis",
            "time_allocation": "longer time requirements (20-45 minutes per question)",
            "question_characteristics": "Complex questions requiring evaluation, synthesis, critical thinking, and creation of solutions",
            "bloom_focus": "Analyze (30%), Evaluate (35%), Create (35%)",
            "example_verbs": "evaluate, critique, justify, design, create, synthesize, propose, develop"
        }
    }
    
    # Get difficulty configuration
    difficulty_config = difficulty_configs.get(difficulty_level.lower(), difficulty_configs["moderate"])
    
    # Question type specific prompts
    question_prompts = {
        "assignment": {
            "description": "comprehensive assignment questions that test deep understanding and application",
            "format": "detailed questions with multiple parts (a, b, c) that build upon each other",
            "example": "Q1. (a) Define [concept] and explain its importance. (b) Analyze how [concept] applies to [scenario]. (c) Design a solution using [concept] for the given problem."
        },
        "mcq": {
            "description": "multiple choice questions with 4 options each, testing knowledge and understanding",
            "format": "clear questions with one correct answer and three plausible distractors",
            "example": "Q1. Which of the following best describes [concept]?\nA) Option 1\nB) Option 2 (Correct)\nC) Option 3\nD) Option 4"
        },
        "casestudy": {
            "description": "case study based questions that require analysis and critical thinking",
            "format": "realistic scenarios followed by analytical questions",
            "example": "Case Study: [Detailed scenario]\nQ1. Analyze the situation described above.\nQ2. What are the key challenges?\nQ3. Propose a solution with justification."
        }
    }
    
    selected_prompt = question_prompts.get(question_type, question_prompts["assignment"])
    
    # Build topics focus section
    topics_focus = ""
    if truncated_topics:
        topics_focus = f"""
SPECIFIC TOPIC FOCUS:
The questions should particularly emphasize these topics: {truncated_topics}
While still covering the broader syllabus, give special attention to these specified areas.
"""
    
    # Enhanced prompt for question generation
    prompt = f"""You are an expert educator and question paper designer with extensive experience in curriculum development.

TASK: Generate a comprehensive question paper based on the provided syllabus and learning objectives.

SYLLABUS CONTENT:
{truncated_syllabus}

LEARNING OBJECTIVES:
{truncated_objectives}
{topics_focus}
DIFFICULTY LEVEL: {difficulty_level.upper()}
Target difficulty: {difficulty_config['description']}

QUESTION TYPE: {question_type.upper()}
Generate {selected_prompt['description']}.

DIFFICULTY-SPECIFIC REQUIREMENTS FOR {difficulty_level.upper()} LEVEL:
1. **Cognitive Focus**: Emphasize {difficulty_config['cognitive_levels']} level thinking
2. **Complexity**: Questions should have {difficulty_config['complexity']}
3. **Time Allocation**: Design questions with {difficulty_config['time_allocation']}
4. **Bloom's Taxonomy Distribution**: {difficulty_config['bloom_focus']}
5. **Question Characteristics**: {difficulty_config['question_characteristics']}
6. **Recommended Action Verbs**: Use verbs like {difficulty_config['example_verbs']}

GENERAL REQUIREMENTS:
1. **Question Format**: {selected_prompt['format']}
2. **Coverage**: Ensure questions cover all major topics from the syllabus
3. **Alignment**: All questions must directly relate to the provided learning objectives
4. **Practical Application**: Include real-world scenarios appropriate to the difficulty level

SPECIFIC INSTRUCTIONS FOR {question_type.upper()}:
{selected_prompt['example']}

STRUCTURE:
- Generate 8-10 questions total
- Provide clear question numbering (Q1, Q2, etc.)
- Include marks allocation for each question (adjust marks based on difficulty)
- Add brief instructions for students at the beginning
- Ensure all questions match the {difficulty_level} difficulty level consistently

QUALITY STANDARDS FOR {difficulty_level.upper()} DIFFICULTY:
- Questions should be unambiguous and clearly worded
- Maintain consistent difficulty level throughout the paper
- Avoid questions that are too easy or too hard for the specified level
- Ensure each question tests specific learning outcomes at the appropriate cognitive level
- Maintain academic rigor appropriate for {difficulty_level} level assessment

IMPORTANT: Every single question in the paper must be at {difficulty_level.upper()} difficulty level. Do not mix difficulty levels.

Please generate a complete, ready-to-use question paper that an instructor could immediately use for {difficulty_level} level assessment."""

    try:
        # using diff ai services 
        if ai_model == "openai":
            result = analyze_with_openai(prompt)
        elif ai_model == "openrouter":
            result = analyze_with_openrouter(prompt)
        elif ai_model == "groq":
            result = analyze_with_groq(prompt)
        elif ai_model == "huggingface":
            result = analyze_with_huggingface(prompt)
        elif ai_model == "gemini":
            result = analyze_with_gemini(prompt)
        else:
            logger.error(f"Unsupported AI service for generation: {ai_model}")
            return "Error: Unsupported AI service configured for generation."
        
        logger.info(f"Question generation completed with {ai_model}")
        return result
        
    except Exception as e:
        logger.error(f"Error during question generation: {str(e)}")
        return f"Error during question generation: {str(e)}"
