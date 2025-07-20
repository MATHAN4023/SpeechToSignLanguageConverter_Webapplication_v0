from pymongo import MongoClient
from bson import ObjectId
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import certifi
import logging
import ssl
from functools import wraps
import time
from urllib.parse import quote_plus

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MongoDB connection
client = None
db = None
users = None

def get_db_connection():
    global client, db, users
    if client is None:
        try:
            logger.info("Attempting to connect to MongoDB...")
            # Get MongoDB URI from environment
            mongodb_uri = os.getenv('MONGODB_URI')
            if not mongodb_uri:
                raise ValueError("MONGODB_URI environment variable is not set")
            
            # URL encode the connection string
            if '@' in mongodb_uri:
                # Split the URI into parts
                protocol = mongodb_uri.split('://')[0] + '://'
                rest = mongodb_uri.split('://')[1]
                auth_part = rest.split('@')[0]
                host_part = rest.split('@')[1]
                
                # URL encode the username and password
                username = quote_plus(auth_part.split(':')[0])
                password = quote_plus(auth_part.split(':')[1])
                
                # Reconstruct the URI
                mongodb_uri = f"{protocol}{username}:{password}@{host_part}"
            
            # Create MongoDB client with basic configuration
            client = MongoClient(
                mongodb_uri,
                tls=True,
                tlsAllowInvalidCertificates=False,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=30000,
                socketTimeoutMS=30000
            )
            
            # Test connection
            logger.debug("Testing connection with ping command...")
            client.admin.command('ping')
            
            # Get database
            db = client.get_database('Cluster0')  # Specify the database name
            users = db.users
            logger.info("Successfully connected to MongoDB")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            if client:
                logger.info("Closing failed client connection")
                client.close()
            client = None
            db = None
            users = None
            raise
    return db, users

def create_user(username, email, password):
    try:
        db, users = get_db_connection()
        if users.find_one({'email': email}):
            return {'error': 'Email already exists'}, 400
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user document with all required fields
        user = {
            'username': username,
            'email': email,
            'password': hashed_password.decode('utf-8'),
            'created_at': datetime.utcnow()
        }
        
        logger.debug(f"Creating user with data: {user}")
        result = users.insert_one(user)
        logger.debug(f"User created with ID: {result.inserted_id}")
        
        # Verify the user was created with all fields
        created_user = users.find_one({'_id': result.inserted_id})
        if not created_user or 'username' not in created_user:
            logger.error("User creation verification failed")
            return {'error': 'Failed to create user'}, 500
            
        return {'message': 'User created successfully'}, 201
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return {'error': 'Internal server error'}, 500

def login_user(email, password):
    try:
        db, users = get_db_connection()
        user = users.find_one({'email': email})
        logger.debug(f"Found user in database: {user}")
        
        if not user:
            logger.error(f"No user found with email: {email}")
            return {'error': 'Invalid credentials'}, 401
        
        # Verify hashed password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            logger.error("Password verification failed")
            return {'error': 'Invalid credentials'}, 401
        
        # Get username from the user document or create one
        username = user.get('username')
        if not username:
            # If username is missing, use email prefix
            username = email.split('@')[0]
            # Update the user document with the username
            users.update_one(
                {'_id': user['_id']},
                {'$set': {'username': username}}
            )
            logger.debug(f"Added username to user document: {username}")
        
        token = jwt.encode(
            {
                'user_id': str(user['_id']),
                'exp': datetime.utcnow() + timedelta(days=1)
            },
            os.getenv('JWT_SECRET_KEY'),
            algorithm='HS256'
        )
        
        # Create user data dictionary with all required fields
        user_data = {
            'id': str(user['_id']),
            'username': username,
            'email': user['email'],
            'created_at': user.get('created_at', '')
        }
        
        logger.debug(f"Created user data: {user_data}")
        response_data = {
            'token': token,
            'user': user_data
        }
        logger.debug(f"Final response data: {response_data}")
        return response_data, 200
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return {'error': 'Internal server error'}, 500

def verify_token(token):
    try:
        if not token:
            return None
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
            
        payload = jwt.decode(token, os.getenv('JWT_SECRET_KEY'), algorithms=['HS256'])
        user_id = payload['user_id']
        
        db, users = get_db_connection()
        user = users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return None
            
        # Get username from the user document or create one
        username = user.get('username')
        if not username:
            # If username is missing, use email prefix
            username = user['email'].split('@')[0]
            # Update the user document with the username
            users.update_one(
                {'_id': user['_id']},
                {'$set': {'username': username}}
            )
            logger.debug(f"Added username to user document: {username}")
            
        # Return complete user data
        user_data = {
            'id': str(user['_id']),
            'username': username,
            'email': user['email'],
            'created_at': user.get('created_at', '')
        }
        logger.debug(f"Token verification successful, returning user data: {user_data}")
        return user_data
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        return None 