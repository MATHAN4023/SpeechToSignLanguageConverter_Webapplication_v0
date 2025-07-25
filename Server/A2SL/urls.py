from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from A2SL import views
import os
import logging

# Set up logging
logger = logging.getLogger(__name__)

app_name = 'A2SL'

# Log the URL patterns being registered
logger.info("Registering URL patterns for A2SL app")
logger.info("Current working directory: %s", os.getcwd())
logger.info("A2SL app directory: %s", os.path.dirname(os.path.abspath(__file__)))

urlpatterns = [
    # API endpoints
    path('api/translate/', views.translate_text, name='translate_text'),
    path('api/get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
    path('api/get-animation-words/', views.get_animation_words, name='get_animation_words'),
    path('api/login', views.api_login, name='api_login'),
    path('api/signup', views.api_signup, name='api_signup'),
    path('api/verify', views.api_verify, name='api_verify'),
    path('api/animation/', views.animation_view, name='api_animation'),
    
    # Regular views
    path('', views.home_view, name='home'),
    path('about/', views.about_view, name='about'),
    path('contact/', views.contact_view, name='contact'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('animation/', views.animation_view, name='animation'),
]

# Log the final URL patterns
logger.info("Registered URL patterns: %s", urlpatterns)
logger.info("Full URL patterns with app_name: %s", [f"{app_name}:{pattern.name}" for pattern in urlpatterns])

# Serve static files from assets/avatar as /static/ when DEBUG=True
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, 'assets', 'avatar'))
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
