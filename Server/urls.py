from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
import logging
import os

# Set up logging
logger = logging.getLogger(__name__)

# Log the URL patterns being registered
logger.info("Registering main URL patterns")
logger.info("Current working directory: %s", os.getcwd())
logger.info("Project directory: %s", os.path.dirname(os.path.abspath(__file__)))

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('A2SL.urls')),  # Include A2SL app URLs at root
]

# Log the final URL patterns
logger.info("Registered main URL patterns: %s", urlpatterns)
logger.info("Full URL patterns with namespaces: %s", [pattern.name for pattern in urlpatterns if hasattr(pattern, 'name')])

# Add static files serving
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 