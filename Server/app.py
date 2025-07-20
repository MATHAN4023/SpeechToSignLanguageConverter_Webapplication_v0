from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import create_user, login_user, verify_token, get_db_connection
from reply_generator import reply_generator
import os
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        logger.debug("Received signup request")
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        return jsonify(create_user(username, email, password))
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        logger.debug(f"Login request data: {data}")
        
        if not data or 'email' not in data or 'password' not in data:
            logger.error("Missing email or password in request")
            return jsonify({'error': 'Missing email or password'}), 400
            
        result, status_code = login_user(data['email'], data['password'])
        logger.debug(f"Login result: {result}, status code: {status_code}")
        
        if status_code != 200:
            logger.error(f"Login failed: {result}")
            return jsonify(result), status_code
            
        # Verify the response contains user data with username
        if 'user' not in result or 'username' not in result['user']:
            logger.error(f"Login response missing username: {result}")
            # Try to get the user from the database
            db, users = get_db_connection()
            user = users.find_one({'email': data['email']})
            if user and 'username' in user:
                result['user']['username'] = user['username']
                logger.debug(f"Added username to response: {result}")
            else:
                # If username is still missing, use email prefix
                result['user']['username'] = data['email'].split('@')[0]
                logger.debug(f"Using email prefix as username: {result}")
            
        logger.debug(f"Login successful, returning: {result}")
        return jsonify(result), status_code
        
    except Exception as e:
        logger.error(f"Error in login endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/verify', methods=['GET'])
def verify():
    try:
        token = request.headers.get('Authorization')
        logger.debug(f"Received verify request with token: {token}")
        
        if not token:
            logger.error("No token provided in verify request")
            return jsonify({'error': 'No token provided'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
            logger.debug(f"Extracted token: {token}")
        
        user = verify_token(token)
        logger.debug(f"Verify token result: {user}")
        
        if not user:
            logger.error("Token verification failed")
            return jsonify({'error': 'Invalid token'}), 401
        
        logger.debug(f"Token verification successful for user: {user}")
        return jsonify({'user': user}), 200
    except Exception as e:
        logger.error(f"Verify token error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/generate-reply', methods=['POST'])
def generate_reply():
    try:
        data = request.get_json()
        logger.debug(f"Generate reply request data: {data}")
        
        if not data or 'text' not in data:
            logger.error("Missing text in request")
            return jsonify({'error': 'Missing text field'}), 400
            
        text = data['text']
        reply = reply_generator.generate_reply(text)
        
        logger.debug(f"Generated reply: {reply}")
        return jsonify({'reply': reply}), 200
        
    except Exception as e:
        logger.error(f"Error in generate-reply endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def init_app():
    try:
        # Load environment variables
        if not os.getenv('MONGODB_URI'):
            logger.error("MONGODB_URI environment variable is not set")
            return False
        
        if not os.getenv('JWT_SECRET_KEY'):
            logger.error("JWT_SECRET_KEY environment variable is not set")
            return False
        
        # Test MongoDB connection
        get_db_connection()
        logger.info("MongoDB connection successful")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize app: {str(e)}")
        return False

if __name__ == '__main__':
    if not init_app():
        logger.error("Failed to initialize application. Exiting...")
        sys.exit(1)
    
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    logger.info(f"Starting Flask server on {host}:{port}")
    app.run(debug=False, port=port, host=host) 