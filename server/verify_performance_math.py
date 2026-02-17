import os
import django
import datetime
from django.conf import settings
from django.db.models import Sum

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from django.contrib.auth import get_user_model
from finance.models import FinancialTransaction
from properties.models import Property
from finance.views import FinancialTransactionViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.request import Request

User = get_user_model()

def verify_math():
    factory = APIRequestFactory()
    
    # 1. Target Property: Maison Bali
    prop = Property.objects.filter(name='Maison Bali').first()
    if not prop:
        print("Maison Bali not found.")
        return

    owner = prop.owner
    if not owner:
        print("No owner for Maison Bali.")
        return

    print(f"--- Verifying Performance for {prop.name} ---")
    
    # 2. Call the dashboard_stats view for this property
    wsgi_request = factory.get(f'/api/v1/finance/transactions/dashboard-stats/?property={prop.id}')
    
    # Instantiate viewset
    viewset = FinancialTransactionViewSet()
    
    # Use force_authenticate helper if possible, or just mock it carefully
    force_authenticate(wsgi_request, user=owner)
    
    # Wrap in DRF Request
    drf_request = Request(wsgi_request)
    
    viewset.request = drf_request
    viewset.format_kwarg = None
    
    response = viewset.dashboard_stats(drf_request)
    
    if response.status_code != 200:
        print(f"Error: View returned status {response.status_code}")
        print(response.data)
        return

    data = response.data
    summary = data.get('property_summary')
    
    if not summary:
        print("Error: No property_summary in response.")
        return

    net = summary.get('net_revenue')
    realized_yield = summary.get('yield')
    
    print(f"\nCalculated Net (Cashflow Net): {net}€")
    print(f"Calculated Yield (Rendement Réel): {realized_yield}%")

    # 3. Validation Logic
    rents = FinancialTransaction.objects.filter(
        property=prop, 
        category=FinancialTransaction.Category.RENT,
        type=FinancialTransaction.TransactionType.INFLOW
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    expenses = FinancialTransaction.objects.filter(
        property=prop,
        type=FinancialTransaction.TransactionType.OUTFLOW
    ).exclude(category=FinancialTransaction.Category.PROMOTION_SALE).aggregate(total=Sum('amount'))['total'] or 0
    
    expected_net = float(rents) - float(expenses)
    
    print(f"Expected Net (Rents - Operating Expenses): {expected_net}€")
    
    if abs(net - expected_net) < 1.0:
        print("\n✅ SUCCESS: Net Cashflow matches expected value (Acquisition cost excluded).")
    else:
        print(f"\n❌ FAILURE: Net Cashflow {net} does NOT match expected {expected_net}.")

    if realized_yield < 100:
        print(f"✅ SUCCESS: Yield is realistic ({realized_yield}%).")
    else:
        print(f"❌ FAILURE: Yield is still extreme ({realized_yield}%).")

if __name__ == "__main__":
    verify_math()
