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

def test_robust_yield_multi_month():
    print("Testing Robust Yield Logic (Multi-Month Spike Prevention)...")
    print("-" * 50)
    
    # 1. Setup
    user = User.objects.filter(role='ADMIN_MADIS').first() or User.objects.first()
    
    # Acquisition 2 years ago (5,000,000€)
    acquisition_date = datetime.date.today() - datetime.timedelta(days=2*365)
    prop = Property.objects.create(
        name="Test Spike Prop",
        city="Spike City",
        prix_acquisition=Decimal('5000000.00'),
        loyer_mensuel=Decimal('5000.00'),
        date_acquisition=acquisition_date
    )
    
    # 2. Record 3 months of rent ON THE SAME DAY (like the user)
    # Jan, Feb, March 2026
    pay_date = datetime.date.today()
    for m in [1, 2, 3]:
        FinancialTransaction.objects.create(
            property=prop,
            type='INFLOW',
            category='RENT',
            amount=Decimal('5000.00'),
            date=pay_date,
            period_month=m,
            period_year=2026,
            created_by=user
        )
    
    factory = APIRequestFactory()
    view = FinancialTransactionViewSet.as_view({'get': 'dashboard_stats'})
    request = factory.get(f'/api/v1/finance/transactions/dashboard-stats/?property={prop.id}')
    request.user = user
    response = view(request)
    
    stats = response.data['property_summary']
    yield_val = stats['yield']
    theoretical_yield = stats['theoretical_yield']
    
    print(f"Property: {prop.name}")
    print(f"Investment: {stats['investment']}€")
    print(f"Theoretical Yield: {theoretical_yield}%")
    print(f"Realized Yield (Robust): {yield_val}%")
    
    # EXPECTATION:
    # Net = 15000.
    # Yield Start = Jan 1 2026.
    # Yield End = Max(Today, March 31 2026) = March 31 2026 (assuming today is Feb 15).
    # Duration = 3 months.
    # Yield = (15000 / 5000000) / (3 months / 12 months) * 100 = 1.2%.
    
    # Even if it's not EXACTLY 1.2 (due to days in month), it should be very close.
    # It definitely should NOT be 80%+.
    
    assert 1.0 <= yield_val <= 2.0, f"Yield should be around 1.2%, got {yield_val}%"
    print("PASS: Yield is stable despite same-day transaction recording.")

    # Cleanup
    prop.delete()
    print("\nRobust yield test passed successfully!")

if __name__ == "__main__":
    try:
        test_robust_yield_multi_month()
    except Exception as e:
        print(f"FAILURE: {e}")
        import traceback
        traceback.print_exc()
