import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import wordnet
import random

# Download required NLTK data
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')

class ReplyGenerator:
    def __init__(self):
        self.greeting_patterns = {
            'hi': ['Hi!', 'Hello!', 'Hey there!'],
            'hello': ['Hello!', 'Hi there!', 'Hey!'],
            'hey': ['Hey!', 'Hi!', 'Hello!'],
            'how are you': ['I\'m doing well, thank you!', 'I\'m fine, thanks!', 'I\'m good, how are you?'],
            'how\'s it going': ['It\'s going well!', 'Pretty good!', 'Not bad!'],
            'what\'s up': ['Not much, just helping with sign language!', 'Just here to help!', 'All good!']
        }
        
        self.default_responses = [
            "I understand. How can I help you with sign language?",
            "That's interesting. Would you like to learn the sign for that?",
            "I can help you learn the sign language for that.",
            "Let me show you how to sign that."
        ]

    def generate_reply(self, text):
        # Convert text to lowercase for matching
        text = text.lower()
        
        # Check for greeting patterns
        for pattern, responses in self.greeting_patterns.items():
            if pattern in text:
                return random.choice(responses)
        
        # If no specific pattern matches, return a default response
        return random.choice(self.default_responses)

# Create a singleton instance
reply_generator = ReplyGenerator() 