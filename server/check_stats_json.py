
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from finance.views import FinancialTransactionViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model

User = get_user_model()

def check_dashboard_stats():
    factory = APIRequestFactory()
    # Mocking a request for 2026 (based on the screenshot)
    request = factory.get('/api/v1/finance/transactions/dashboard-stats/', {'year': '2026'})
    
    # Authenticate as admin
    user = User.objects.filter(role='ADMIN_MADIS').first()
    if not user:
        user = User.objects.first()
    force_authenticate(request, user=user)
    
    view = FinancialTransactionViewSet.as_view({'get': 'dashboard_stats'})
    response = view(request)
    
    print("API Response Status:", response.status_code)
    data = response.data
    
    print("\n--- SUMMARY CARDS ---")
    print(f"Net Revenue: {data.get('net_revenue')}")
    print(f"Total Inflow: {data.get('total_inflow')}")
    print(f"Total Outflow: {data.get('total_outflow')}")
    
    print("\n--- PROPERTY STATS (Array Length: {}) ---".format(len(data.get('property_stats', []))))
    for p in data.get('property_stats', []):
        print(f"- ID: {p.get('id')}, Name: {p.get('name')}, Yield: {p.get('yield')}%")
    
    if not data.get('property_stats'):
        print("!! WARNING: property_stats is EMPTY !!")

if __name__ == "__main__":
    check_dashboard_stats()
