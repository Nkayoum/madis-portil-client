"""
Main URL configuration for MADIS Portal.
All API endpoints are versioned under /api/v1/.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from decouple import config
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .version import __version__


@api_view(['GET'])
@permission_classes([AllowAny])
def api_version(request):
    """Returns the current API version."""
    return Response({
        'version': __version__,
        'api': 'v1',
        'name': 'Portail Clients MADIS',
    })


# API v1 URL patterns
api_v1_patterns = [
    path('auth/', include('accounts.urls')),
    path('', include('properties.urls')),
    path('', include('documents.urls')),
    path('', include('messaging.urls')),
    path('construction/', include('construction.urls')),
    path('finance/', include('finance.urls')),
    path('backoffice/', include('backoffice.urls')),
    path('version/', api_version, name='api-version'),

    # API Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

urlpatterns = [
    # Obfuscated admin access
    path(config('ADMIN_URL', default='madis-vault-admin/'), admin.site.urls),
    path('api/v1/', include((api_v1_patterns, 'api-v1'))),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
