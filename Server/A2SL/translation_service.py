import requests
from functools import lru_cache
import logging
from deep_translator import GoogleTranslator

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Language code mapping
LANGUAGE_MAPPING = {
    'en': 'en',
    'ta': 'ta',
    'hi': 'hi',
    'kn': 'kn',
    'ml': 'ml',
    'en-US': 'en',
    'ta-IN': 'ta',
    'hi-IN': 'hi',
    'kn-IN': 'kn',
    'ml-IN': 'ml'
}

class TranslationService:
    def __init__(self):
        logger.info("TranslationService initialized with Google Translate")
        
    @lru_cache(maxsize=1000)  # Cache translations to improve performance
    def translate_text(self, text, target_language):
        """
        Translate text to the target language using Google Translate
        """
        try:
            # Convert language code to format expected by Google Translate
            target_lang = LANGUAGE_MAPPING.get(target_language, target_language.split('-')[0].lower())
            
            logger.info("Starting translation - Text: '%s', Target language: %s", text, target_lang)
            
            # Make the translation request
            try:
                translator = GoogleTranslator(source='auto', target=target_lang)
                translated_text = translator.translate(text)
                
                logger.info("Translation successful - Target: %s", target_lang)
                logger.info("Original text: %s", text)
                logger.info("Translated text: %s", translated_text)
                
                return {
                    'translated_text': translated_text,
                    'source_language': 'auto'  # deep-translator doesn't provide source language detection
                }
                    
            except Exception as e:
                logger.error("Translation error: %s", str(e), exc_info=True)
                raise Exception(f"Translation error: {str(e)}")
                
        except Exception as e:
            logger.error("Unexpected error during translation: %s", str(e), exc_info=True)
            raise Exception(f"Unexpected error during translation: {str(e)}")

# Create a singleton instance
translation_service = TranslationService() 