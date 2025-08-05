from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.pdf_parser import extract_text
from ai_logic import analyze_question_paper, generate_questions
import os
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app) # allow cross origin requests

# setup logging to file and console
os.makedirs("logs", exist_ok=True)
log_filename = f"logs/app.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler() # also log to terminal
    ]
)

logger = logging.getLogger(__name__)

@app.route("/analyze", methods=["POST"])
def analyze():
    logger.info("Received analysis request")
    
    # check required files in request
    if 'syllabus' not in request.files or 'question_pdf' not in request.files:
        logger.error("Missing syllabus or question file in request")
        return jsonify({"error": "Missing syllabus or question file"}), 400

    syllabus_file = request.files['syllabus']
    question_file = request.files['question_pdf']
    objectives = request.form.get("objectives", "")
    ai_model = request.form.get("ai_model", "groq")  # default to groq (free)
    
    # set ai service env var for ai_logic module
    os.environ['AI_SERVICE'] = ai_model

    logger.info(f"Processing files: syllabus={syllabus_file.filename}, question={question_file.filename}, ai_model={ai_model}")

    # save uploaded files to temp folder
    os.makedirs("tmp", exist_ok=True)
    syllabus_path = f"tmp/{syllabus_file.filename}"
    question_path = f"tmp/{question_file.filename}"
    syllabus_file.save(syllabus_path)
    question_file.save(question_path)

    logger.info("Files saved successfully, extracting text...")

    try:
        # extract text from pdf files
        syllabus_text = extract_text(syllabus_path)
        question_text = extract_text(question_path)
        logger.info("Text extraction completed")

        # run ai analysis
        result = analyze_question_paper(syllabus_text, objectives, question_text)
        logger.info("Analysis completed successfully")
        
        # handle both old string format and new dict format
        if isinstance(result, dict):
            return jsonify(result)
        else:
            # legacy format - just return the analysis text
            return jsonify({"result": result})
    
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/generate", methods=["POST"])
def generate():
    logger.info("Received question generation request")
    
    if 'syllabus' not in request.files:
        logger.error("Missing syllabus file in request")
        return jsonify({"error": "Missing syllabus file"}), 400

    syllabus_file = request.files['syllabus']
    objectives = request.form.get("objectives", "")
    syllabus_topics = request.form.get("syllabus_topics", "")  # new parameter
    question_type = request.form.get("question_type", "assignment")
    difficulty_level = request.form.get("difficulty_level", "moderate")  # new parameter
    ai_model = request.form.get("ai_model", "openrouter")  # default to openrouter for generation
    
    # set ai service for generation
    os.environ['AI_SERVICE'] = ai_model

    logger.info(f"Processing generation: syllabus={syllabus_file.filename}, type={question_type}, difficulty={difficulty_level}, model={ai_model}")
    if syllabus_topics:
        logger.info(f"Specific topics requested: {syllabus_topics[:100]}...")

    os.makedirs("tmp", exist_ok=True)
    syllabus_path = f"tmp/{syllabus_file.filename}"
    syllabus_file.save(syllabus_path)

    logger.info("File saved successfully, extracting text...")

    try:
        syllabus_text = extract_text(syllabus_path)
        logger.info("Text extraction completed")

        # generate questions using ai with new parameters
        result = generate_questions(syllabus_text, objectives, question_type, ai_model, difficulty_level, syllabus_topics)
        logger.info("Question generation completed successfully")
        
        return jsonify({
            "questions": result, 
            "ai_model": ai_model,
            "difficulty_level": difficulty_level,
            "question_type": question_type,
            "syllabus_topics": syllabus_topics
        })
    
    except Exception as e:
        logger.error(f"Error during question generation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    logger.info("Starting Flask application...")
    app.run(debug=True)