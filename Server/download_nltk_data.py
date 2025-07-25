import nltk
import os

nltk_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "nltk_data"))
os.makedirs(nltk_data_dir, exist_ok=True)

nltk.download('punkt', download_dir=nltk_data_dir)
nltk.download('averaged_perceptron_tagger', download_dir=nltk_data_dir)
nltk.download('wordnet', download_dir=nltk_data_dir)
nltk.download('omw-1.4', download_dir=nltk_data_dir)

print("NLTK data download completed successfully at", nltk_data_dir) 