from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login,logout
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import nltk
from django.contrib.staticfiles import finders
from django.contrib.auth.decorators import login_required
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .translation_service import translation_service
import logging
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

def home_view(request):
	return render(request,'home.html')


def about_view(request):
	return render(request,'about.html')


def contact_view(request):
	return render(request,'contact.html')

def animation_view(request):
	if request.method == 'POST':
		try:
			# Get the sentence from the request
			text = request.POST.get('sen', '').strip()
			if not text:
				return JsonResponse({"error": "No text provided"}, status=400)

			# Convert to lowercase for processing
			text = text.lower()
			
			# Tokenize the sentence
			words = word_tokenize(text)

			# Get part of speech tags
			tagged = nltk.pos_tag(words)
			tense = {}
			tense["future"] = len([word for word in tagged if word[1] == "MD"])
			tense["present"] = len([word for word in tagged if word[1] in ["VBP", "VBZ","VBG"]])
			tense["past"] = len([word for word in tagged if word[1] in ["VBD", "VBN"]])
			tense["present_continuous"] = len([word for word in tagged if word[1] in ["VBG"]])

			# Stopwords that will be removed
			stop_words = set(["mightn't", 're', 'wasn', 'wouldn', 'be', 'has', 'that', 'does', 'shouldn', 'do', 
				"you've",'off', 'for', "didn't", 'm', 'ain', 'haven', "weren't", 'are', "she's", "wasn't", 
				'its', "haven't", "wouldn't", 'don', 'weren', 's', "you'd", "don't", 'doesn', "hadn't", 'is', 
				'was', "that'll", "should've", 'a', 'then', 'the', 'mustn', 'i', 'nor', 'as', "it's", "needn't", 
				'd', 'am', 'have',  'hasn', 'o', "aren't", "you'll", "couldn't", "you're", "mustn't", 'didn', 
				"doesn't", 'll', 'an', 'hadn', 'whom', 'y', "hasn't", 'itself', 'couldn', 'needn', "shan't", 
				'isn', 'been', 'such', 'shan', "shouldn't", 'aren', 'being', 'were', 'did', 'ma', 't', 'having', 
				'mightn', 've', "isn't", "won't"])

			# Removing stopwords and applying lemmatizing nlp process to words
			lr = WordNetLemmatizer()
			filtered_text = []
			for w, p in zip(words, tagged):
				if w not in stop_words:
					if p[1]=='VBG' or p[1]=='VBD' or p[1]=='VBZ' or p[1]=='VBN' or p[1]=='NN':
						filtered_text.append(lr.lemmatize(w, pos='v'))
					elif p[1]=='JJ' or p[1]=='JJR' or p[1]=='JJS' or p[1]=='RBR' or p[1]=='RBS':
						filtered_text.append(lr.lemmatize(w, pos='a'))
					else:
						filtered_text.append(lr.lemmatize(w))

			# Adding the specific word to specify tense
			words = filtered_text
			temp = []
			for w in words:
				if w == 'I':
					temp.append('Me')
				else:
					temp.append(w)
			words = temp
			probable_tense = max(tense, key=tense.get)

			if probable_tense == "past" and tense["past"] >= 1:
				temp = ["Before"]
				temp = temp + words
				words = temp
			elif probable_tense == "future" and tense["future"] >= 1:
				if "Will" not in words:
					temp = ["Will"]
					temp = temp + words
					words = temp
			elif probable_tense == "present":
				if tense["present_continuous"] >= 1:
					temp = ["Now"]
					temp = temp + words
					words = temp

			# Process words for sign language
			filtered_text = []
			for w in words:
				path = w + ".mp4"
				f = finders.find(path)
				# Splitting the word if its animation is not present in database
				if not f:
					for c in w:
						filtered_text.append(c)
				# Otherwise animation of word
				else:
					filtered_text.append(w)
			words = filtered_text

			# Create HTML response with the keywords
			html_response = f"""
			<div id="list">
				{"".join(f'<li>{word}</li>' for word in words)}
			</div>
			"""
			
			response = HttpResponse(html_response)
			response["Access-Control-Allow-Origin"] = "http://localhost:5173"
			response["Access-Control-Allow-Credentials"] = "true"
			response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
			response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
			return response
			
		except Exception as e:
			logger.error(f"Error in animation_view: {str(e)}")
			return JsonResponse({"error": str(e)}, status=500)
	
	return render(request, 'animation.html')




def signup_view(request):
	if request.method == 'POST':
		form = UserCreationForm(request.POST)
		if form.is_valid():
			user = form.save()
			login(request,user)
			# log the user in
			return redirect('animation')
	else:
		form = UserCreationForm()
	return render(request,'signup.html',{'form':form})



def login_view(request):
	if request.method == 'POST':
		form = AuthenticationForm(data=request.POST)
		if form.is_valid():
			#log in user
			user = form.get_user()
			login(request,user)
			if 'next' in request.POST:
				return redirect(request.POST.get('next'))
			else:
				return redirect('animation')
	else:
		form = AuthenticationForm()
	return render(request,'login.html',{'form':form})


def logout_view(request):
	logout(request)
	return redirect("home")

def get_animation_words(request):
	"""
	API endpoint to get gesture keywords for animation.
	Returns a JSON response with gesture keywords.
	"""
	import json
	
	# Example gesture keywords - you can modify this list as needed
	gesture_keywords = [
		"hello", "goodbye", "thank you", "please", "sorry",
		"yes", "no", "help", "water", "food"
	]
	
	return JsonResponse({
		'status': 'success',
		'keywords': gesture_keywords
	})

def get_csrf_token(request):
    """
    API endpoint to get CSRF token for React frontend.
    """
    token = get_token(request)
    response = JsonResponse({'csrfToken': token})
    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
    return response

@csrf_exempt
@require_http_methods(["OPTIONS"])
def handle_options(request):
    response = HttpResponse()
    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
    response["Access-Control-Allow-Credentials"] = "true"
    return response

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def translate_text(request):
    logger.info("Received translation request")
    logger.info("Request path: %s", request.path)
    logger.info("Request method: %s", request.method)
    logger.info("Request headers: %s", request.headers)
    logger.info("Request body: %s", request.body)
    
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response

    try:
        # Parse the request body
        data = json.loads(request.body)
        text = data.get('text', '')
        target_language = data.get('target_language', 'en')
        
        logger.info(f"Translation request - Text: '{text}', Target language: {target_language}")
        
        if not text:
            logger.info("No text provided in request")
            return JsonResponse({'error': 'No text provided'}, status=400)
        
        # Get translation from the service
        logger.info("Calling translation service...")
        try:
            translation_result = translation_service.translate_text(text, target_language)
            logger.info("Translation result: %s", translation_result)
            
            # Create the response
            response = JsonResponse({
                'translated_text': translation_result['translated_text'],
                'source_language': translation_result['source_language']
            })
            
            # Add CORS headers
            response["Access-Control-Allow-Origin"] = "http://localhost:5173"
            response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
            response["Access-Control-Allow-Credentials"] = "true"
            
            logger.info("Sending response: %s", response.content)
            return response
        except Exception as e:
            logger.error("Translation service error: %s", str(e))
            return JsonResponse({'error': str(e)}, status=500)
        
    except json.JSONDecodeError as e:
        logger.error("JSON decode error: %s", str(e))
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def api_signup(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        if not username or not email or not password:
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)
        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()
        return JsonResponse({'success': True, 'user': {'username': user.username, 'email': user.email}})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return JsonResponse({'error': 'Missing email or password'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
        user_auth = authenticate(username=user.username, password=password)
        if user_auth is not None:
            login(request, user_auth)
            # Generate JWT token
            refresh = RefreshToken.for_user(user_auth)
            return JsonResponse({
                'token': str(refresh.access_token),
                'user': {'username': user.username, 'email': user.email}
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
