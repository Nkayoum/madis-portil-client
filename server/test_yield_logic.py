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

def test_rolling_yield_logic():
    print("Testing Rolling 12-month Yield Logic...")
    print("-" * 50)
    
    # 1. Setup
    user = User.objects.filter(role='ADMIN_MADIS').first() or User.objects.first()
    
    # Acquisition 5 years ago (5,000,000€)
    acquisition_date = datetime.date.today() - datetime.timedelta(days=5*365)
    prop = Property.objects.create(
        name="Test Yield Prop (High Price)",
        city="Yield City",
        prix_acquisition=Decimal('5000000.00'),
        loyer_mensuel=Decimal('5000.00'),
        date_acquisition=acquisition_date
    )
    
    # 2. Add Recent Rent (This month)
    FinancialTransaction.objects.create(
        property=prop,
        type='INFLOW',
        category='RENT',
        amount=Decimal('5000.00'),
        date=datetime.date.today(),
        period_month=datetime.date.today().month,
        period_year=datetime.date.today().year,
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
    print(f"Days held (Historical): {(datetime.date.today() - acquisition_date).days}")
    print(f"Theoretical Yield: {theoretical_yield}% (Loyer 5k * 12 / 5M)")
    print(f"Realized Yield (Rolling): {yield_val}%")
    
    # OLD CALCULATION (approx): 5000 / 5000000 / (1825 / 365) * 100 = 0.002%
    # NEW CALCULATION (approx): 1 month of 5000 annualizes to 60000. 
    # 60000 / 5000000 * 100 = 1.2%
    
    assert yield_val > 0.5, f"Yield should be closer to 1.2%, got {yield_val}%"
    print("PASS: Yield accurately reflects recent performance despite old acquisition date.")

    # Cleanup
    prop.delete()
    print("\nAll yield tests passed successfully!")

if __name__ == "__main__":
    try:
        test_rolling_yield_logic()
    except Exception as e:
        print(f"FAILURE: {e}")
        import traceback
        traceback.print_exc()
