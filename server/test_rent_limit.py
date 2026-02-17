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
from finance.serializers import FinancialTransactionSerializer
from rest_framework import serializers

User = get_user_model()

def test_rent_limit_validation():
    print("Testing Rent Amount Limit Validation...")
    print("-" * 50)
    
    # 1. Setup
    user = User.objects.filter(role='ADMIN_MADIS').first() or User.objects.first()
    prop = Property.objects.create(
        name="Test Limit Prop",
        city="Limit City",
        loyer_mensuel=Decimal('5000.00')
    )
    
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user
    
    # 2. TEST EXCESSIVE AMOUNT
    print("\n[Case 1] Attempting to create RENT of 50,000€ (Target is 5,000€)...")
    data_excessive = {
        'property': prop.id,
        'type': 'INFLOW',
        'category': 'RENT',
        'amount': '50000.00',
        'date': '2026-03-01',
        'period_month': 3,
        'period_year': 2026
    }
    
    serializer = FinancialTransactionSerializer(data=data_excessive, context={'request': request})
    if not serializer.is_valid():
        errors = serializer.errors
        print(f"Caught expected validation error: {errors}")
        assert 'amount' in errors, "Validation error should be in 'amount' field"
        print("PASS: System blocked excessive rent amount.")
    else:
        print("FAILURE: System erroneously accepted 50,000€ rent!")
        prop.delete()
        sys.exit(1)

    # 3. TEST VALID AMOUNT
    print("\n[Case 2] Attempting to create RENT of 5,000€...")
    data_valid = data_excessive.copy()
    data_valid.update({'amount': '5000.00'})
    
    serializer_valid = FinancialTransactionSerializer(data=data_valid, context={'request': request})
    if serializer_valid.is_valid():
        serializer_valid.save()
        print("PASS: System accepted valid rent amount.")
    else:
        print(f"FAILURE: System rejected valid rent amount! {serializer_valid.errors}")
        prop.delete()
        sys.exit(1)

    # Cleanup
    prop.delete()
    print("\nAll rent limit tests passed successfully!")

if __name__ == "__main__":
    try:
        test_rent_limit_validation()
    except Exception as e:
        print(f"CRITICAL FAILURE: {e}")
        import traceback
        traceback.print_exc()
