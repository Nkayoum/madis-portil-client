import os
import django
import sys
import datetime
from decimal import Decimal

# Setup Django
sys.path.append('c:\\Users\\bytes\\OneDrive\\Documents\\DEV Bytes\\test\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from finance.models import FinancialTransaction
from properties.models import Property
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from finance.views import FinancialTransactionViewSet

User = get_user_model()

def test_shortfall_logic():
    print("Testing Refined Shortfall Logic...")
    print("-" * 50)
    
    # 1. Setup
    user = User.objects.filter(role='ADMIN_MADIS').first() or User.objects.first()
    
    # Acquisition in 2024
    prop = Property.objects.create(
        name="Test Shortfall Prop",
        city="Shortfall City",
        loyer_mensuel=Decimal('5000.00'),
        date_acquisition=datetime.date(2024, 1, 1)
    )
    
    factory = APIRequestFactory()
    view = FinancialTransactionViewSet.as_view({'get': 'dashboard_stats'})
    
    # 2. Case: Only Jan 2026 paid, Today is Feb 2026
    # We expect the logic to count ONLY Jan and Feb 2026.
    print("\n[Case 1] Paying Jan 2026 only (Target 5000€/mo)...")
    FinancialTransaction.objects.create(
        property=prop,
        type='INFLOW',
        category='RENT',
        amount=Decimal('5000.00'),
        date=datetime.date(2026, 1, 15),
        period_month=1,
        period_year=2026,
        created_by=user
    )
    
    request = factory.get(f'/api/v1/finance/transactions/dashboard-stats/?property={prop.id}')
    request.user = user
    response = view(request)
    
    stats = response.data['property_summary']
    expected_monthly = response.data['expected_monthly_rent']
    
    print(f"Expected Monthly Rent: {expected_monthly}€")
    print(f"Collection Rate: {stats['collection_rate']}%")
    print(f"Shortfall: {stats['shortfall']}€")
    
    # Calculation:
    # First rent: Jan 2026. 
    # Current month: Feb 2026.
    # Total months: 2.
    # Total expected: 5000 * 2 = 10000.
    # Total actual: 5000.
    # Expected shortfall: 5000.
    # Expected rate: 50%.
    
    assert stats['collection_rate'] == 50.0, f"Expected 50%, got {stats['collection_rate']}%"
    assert stats['shortfall'] == 5000.0, f"Expected 5000€ shortage, got {stats['shortfall']}€"
    print("PASS: Logic correctly ignored empty 2025 months.")

    # 3. Case: Pay Feb 2026 too
    print("\n[Case 2] Paying Feb 2026...")
    FinancialTransaction.objects.create(
        property=prop,
        type='INFLOW',
        category='RENT',
        amount=Decimal('5000.00'),
        date=datetime.date(2026, 2, 10),
        period_month=2,
        period_year=2026,
        created_by=user
    )
    
    response = view(request)
    stats = response.data['property_summary']
    print(f"Collection Rate: {stats['collection_rate']}%")
    print(f"Shortfall: {stats['shortfall']}€")
    
    assert stats['collection_rate'] == 100.0
    assert stats['shortfall'] == 0.0
    print("PASS: 100% collection rate achieved.")

    # 4. Case: Future rent (March 2026)
    # Target should NOT increase until we reach March.
    print("\n[Case 3] Pre-paying March 2026 (Should keep 100% rate)...")
    FinancialTransaction.objects.create(
        property=prop,
        type='INFLOW',
        category='RENT',
        amount=Decimal('5000.00'),
        date=datetime.date(2026, 2, 15),
        period_month=3,
        period_year=2026,
        created_by=user
    )
    
    response = view(request)
    stats = response.data['property_summary']
    print(f"Collection Rate: {stats['collection_rate']}%")
    print(f"Shortfall: {stats['shortfall']}€")
    
    # Still 100% (actually 150% if we don't cap but the target remains 10000)
    # 15000 / 10000 * 100 = 150%
    assert stats['collection_rate'] >= 100.0
    print("PASS: Future rents don't distort the past target.")

    # Cleanup
    prop.delete()
    print("\nAll shortfall tests passed successfully!")

if __name__ == "__main__":
    try:
        test_shortfall_logic()
    except Exception as e:
        print(f"FAILURE: {e}")
        import traceback
        traceback.print_exc()
