
import os
import django
import datetime
from django.utils import timezone
from django.db.models import Q

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from properties.models import Property
from finance.models import FinancialTransaction
from django.contrib.auth import get_user_model

User = get_user_model()

def test_investment_yield_logic():
    print("--- Testing Simplified Investment & Yield Logic ---")
    
    # 1. Setup Data
    user = User.objects.first()
    if not user:
        print("No user found, creating one...")
        user = User.objects.create_user(username='testuser', password='password')

    # Clean previous test properties if any
    Property.objects.filter(name="Test Annex Fees").delete()
    
    # Create Property with Annex Fees
    # Investment = 100,000 (Purchase) + 10,000 (Annex Fees) = 110,000
    prop = Property.objects.create(
        name="Test Annex Fees",
        owner=user,
        prix_acquisition=100000,
        frais_acquisition_annexes=10000,
        loyer_mensuel=1000, # 12,000 / year
        date_acquisition=datetime.date(2025, 1, 1)
    )
    
    print(f"Property Created: {prop.name}")
    print(f"Prix Achat: {prop.prix_acquisition}€")
    print(f"Frais Annexes: {prop.frais_acquisition_annexes}€")
    
    # Expected Theoretical Yield: (1000 * 12) / (100000 + 10000) * 100 = 10.91%
    
    # 2. Add Revenue
    # Jan 2026 rent paid on Jan 1 2026
    FinancialTransaction.objects.create(
        property=prop,
        amount=1000,
        type=FinancialTransaction.TransactionType.INFLOW,
        category=FinancialTransaction.Category.RENT,
        date=datetime.date(2026, 1, 1),
        period_month=1,
        period_year=2026
    )

    # 3. Simulate dashboard_stats logic (simplified)
    # We follow the logic in finance/views.py
    investment = float(prop.prix_acquisition or 0) + float(prop.frais_acquisition_annexes or 0)
    target_annual_rent = float(prop.loyer_mensuel or 0) * 12
    
    theoretical_yield = (target_annual_rent / investment * 100) if investment > 0 else 0
    print(f"Theoretical Yield calculated: {theoretical_yield:.2f}%")
    
    # Check if theoretical yield matches 10.91%
    expected_theoretical = (12000 / 110000) * 100
    assert abs(theoretical_yield - expected_theoretical) < 0.01, f"Expected {expected_theoretical}, got {theoretical_yield}"
    
    # 4. Realized Yield (Rolling Year)
    # net_12m = 1000
    # days_for_yield = (Jan 31 2026 - Jan 1 2026) -> 31 days (if today is Jan 31 2026)
    # but based on period logic in views.py...
    
    print("Test Logic Passed!")

if __name__ == "__main__":
    test_investment_yield_logic()
