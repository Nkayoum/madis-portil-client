from django.urls import path
from .views import SecurityStatusView

app_name = 'backoffice'

urlpatterns = [
    path('security-status/', SecurityStatusView.as_view(), name='security_status'),
]
