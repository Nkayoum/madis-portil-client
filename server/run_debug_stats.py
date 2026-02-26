from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from finance.views import FinancialTransactionViewSet
import json
import traceback

User = get_user_model()
# Try to find an OWNER user, or just mock the role on someone
user = User.objects.filter(role='OWNER').first()
if not user:
    user = User.objects.filter(is_superuser=True).first()
    # Mock role for the test
    user.role = 'OWNER'

factory = APIRequestFactory()
request = factory.get('/api/finance/transactions/dashboard-stats/', {'year': '2026', 'property': '50'})
force_authenticate(request, user=user)

viewset = FinancialTransactionViewSet.as_view({'get': 'dashboard_stats'})

print("Calling dashboard_stats...")
try:
    response = viewset(request)
    print(f"Status Code: {response.status_code}")
    print("Response Data:")
    print(json.dumps(response.data, indent=2))
except Exception as e:
    print(f"Fatal Error: {e}")
    print(traceback.format_exc())
