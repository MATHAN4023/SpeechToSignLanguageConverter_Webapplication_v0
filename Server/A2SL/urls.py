from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from A2SL import views  # assuming views.py is inside A2SL/
import os  # Add this import for static files configuration

urlpatterns = [
    path('admin/', admin.site.urls),
    path('about/', views.about_view, name='about'),
    path('contact/', views.contact_view, name='contact'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('animation/', views.animation_view, name='animation'),
    path('reply/<str:reply_text>/<str:video_name>/', views.reply_view, name='reply_page'),
    path('', views.home_view, name='home'),

    # 🔄 API for React to get gesture keywords
    path('api/get-gesture-keywords/', views.get_animation_words),
    path('get-animation-words/', views.get_animation_words, name='get_animation_words'),
    path('get-csrf-token/', views.get_csrf_token, name='get_csrf_token'),
    path('api/text-to-sign-reply/', views.text_to_sign_reply_view, name='text_to_sign_reply'),
    path('api/get-sign-response/', views.get_sign_response, name='get_sign_response'),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, 'avatar'))
