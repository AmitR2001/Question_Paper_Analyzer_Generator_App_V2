from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from utils.pdf_parser import extract_text
from ai_logic import analyze_question_paper, generate_questions
from werkzeug.security import check_password_hash, generate_password_hash
import os
import logging
import re
from datetime import datetime

app = Flask(__name__)
CORS(app) # allow cross origin requests

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['question_difficulty_app']
users_collection = db['users']

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

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'message': 'Username and password are required'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Find user in database by username
        user = users_collection.find_one({'username': username})
        
        if not user:
            return jsonify({'message': 'Invalid username or password'}), 401
        
        # Check password
        if not check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid username or password'}), 401
        
        # Return success response
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'username': user['username'],
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    return len(username.strip()) >= 3

def validate_password(password):
    return len(password) >= 6

@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        
        # Extract and validate required fields
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        errors = []
        
        if not username:
            errors.append('Username is required')
        elif not validate_username(username):
            errors.append('Username must be at least 3 characters long')
        
        if not email:
            errors.append('Email is required')
        elif not validate_email(email):
            errors.append('Invalid email format')
        
        if not password:
            errors.append('Password is required')
        elif not validate_password(password):
            errors.append('Password must be at least 6 characters long')
        
        if errors:
            return jsonify({'message': '; '.join(errors)}), 400
        
        # Check if user already exists (by email or username)
        existing_user = users_collection.find_one({
            '$or': [
                {'email': email},
                {'username': username}
            ]
        })
        
        if existing_user:
            if existing_user.get('email') == email:
                return jsonify({'message': 'User with this email already exists'}), 409
            else:
                return jsonify({'message': 'Username already taken'}), 409
        
        # Hash password
        hashed_password = generate_password_hash(password)
        
        # Create user document with only required fields
        user_doc = {
            'username': username,
            'email': email,
            'password': hashed_password,
            'createdAt': datetime.utcnow(),
            'isActive': True
        }
        
        # Insert user into database
        result = users_collection.insert_one(user_doc)
        
        if result.inserted_id:
            logger.info(f"New user registered: {username} ({email})")
            return jsonify({
                'message': 'User registered successfully',
                'userId': str(result.inserted_id)
            }), 201
        else:
            return jsonify({'message': 'Failed to register user'}), 500
            
    except Exception as e:
        logger.error(f"Error in register_user: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

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
    ai_model = request.form.get("ai_model", "gemini")  # default to Gemini Pro
    
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

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = list(users_collection.find({}, {'password': 0}))  # Exclude password field
        for user in users:
            user['_id'] = str(user['_id'])  # Convert ObjectId to string
        return jsonify(users), 200
    except Exception as e:
        logger.error(f"Error in get_users: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow()}), 200

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
    ai_model = request.form.get("ai_model", "gemini")  # default to Gemini Pro for generation
    
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