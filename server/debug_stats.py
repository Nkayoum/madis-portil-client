import os
import django
import sys
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from finance.views import FinancialTransactionViewSet
from rest_framework.request import Request

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

User = get_user_model()
user = User.objects.filter(is_superuser=True).first()

if not user:
    print("No superuser found. Creating one...")
    user = User.objects.create_superuser('admin_debug', 'admin@example.com', 'password123')

factory = RequestFactory()
request = factory.get('/api/finance/transactions/dashboard-stats/', {'year': '2026'})
request.user = user

# Wrap in DRF Request
from rest_framework.parsers import JSONParser
drf_request = Request(request, parsers=[JSONParser])

viewset = FinancialTransactionViewSet()
viewset.request = drf_request
viewset.format_kwarg = None

print("Calling dashboard_stats...")
try:
    response = viewset.dashboard_stats(drf_request)
    print(f"Status Code: {response.status_code}")
    print("Response Data:")
    import json
    print(json.dumps(response.data, indent=2))
except Exception as e:
    import traceback
    print(f"Fatal Error: {e}")
    print(traceback.format_exc())
