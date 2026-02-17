import os
import django
import sys
import datetime

# Setup Django
sys.path.append('c:\\Users\\bytes\\OneDrive\\Documents\\DEV Bytes\\test\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from django.test import RequestFactory
from finance.views import FinancialTransactionViewSet
from django.contrib.auth import get_user_model

User = get_user_model()

def test_global_dashboard_stats():
    print("Testing Global Dashboard Stats API...")
    print("-" * 50)
    
    # Get an admin user
    user = User.objects.filter(role='ADMIN_MADIS').first()
    if not user:
        user = User.objects.first()
        
    factory = RequestFactory()
    # Mocking a global request (no property_id)
    request = factory.get('/api/v1/finance/transactions/dashboard-stats/?year=2026')
    request.user = user
    
    view = FinancialTransactionViewSet.as_view({'get': 'dashboard_stats'})
    
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("SUCCESS: Global dashboard returned 200 OK")
            data = response.data
            print(f"Total Inflow: {data.get('total_inflow')}")
            print(f"Monthly Data Count: {len(data.get('monthly_data', []))}")
            print(f"Expected Monthly Rent (Global): {data.get('expected_monthly_rent')}")
            
            # Check if monthly data has expected fields
            if data.get('monthly_data'):
                first_month = data['monthly_data'][0]
                print(f"Sample Month ({first_month['month']}): expected={first_month['expected_rent']}, revenues={first_month['revenues']}")
        else:
            print(f"FAILURE: Backend returned errors: {response.data}")
            
    except Exception as e:
        print(f"CRITICAL FAILURE: Exception during API call: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_global_dashboard_stats()
