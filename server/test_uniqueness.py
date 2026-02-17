import os
import django
import sys
from datetime import date

# Setup Django
sys.path.append('c:\\Users\\bytes\\OneDrive\\Documents\\DEV Bytes\\test\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from finance.models import FinancialTransaction
from properties.models import Property
from django.contrib.auth import get_user_model
from finance.serializers import FinancialTransactionSerializer
from rest_framework.exceptions import ValidationError

User = get_user_model()

def test_uniqueness():
    print("Testing Transaction Uniqueness Validation...")
    print("-" * 50)
    
    # Get a property and a user
    prop = Property.objects.first()
    user = User.objects.first()
    
    if not prop or not user:
        print("ERROR: Need at least one property and one user to test.")
        return

    # Cleanup any existing RENT for Jan 2029 (future date for safety)
    FinancialTransaction.objects.filter(
        property=prop, 
        category=FinancialTransaction.Category.RENT,
        period_month=1,
        period_year=2029
    ).delete()

    # Define common data
    base_data = {
        'property': prop.id,
        'type': FinancialTransaction.TransactionType.INFLOW,
        'category': FinancialTransaction.Category.RENT,
        'amount': 1000,
        'date': '2029-01-15',
        'period_month': 1,
        'period_year': 2029,
        'description': 'Test Rent'
    }

    # 1. Create first RENT transaction
    print("1. Creating first RENT transaction for Jan 2029...")
    serializer = FinancialTransactionSerializer(data=base_data, context={'request': type('obj', (object,), {'user': user})})
    if serializer.is_valid():
        tx1 = serializer.save()
        print(f"SUCCESS: Created transaction ID {tx1.id}")
    else:
        print(f"FAILURE: Expected success, got {serializer.errors}")
        return

    # 2. Attempt to create DUPLICATE RENT transaction
    print("2. Attempting to create duplicate RENT transaction for Jan 2029...")
    serializer2 = FinancialTransactionSerializer(data=base_data, context={'request': type('obj', (object,), {'user': user})})
    if serializer2.is_valid():
        print("FAILURE: Expected validation error, but it was valid!")
    else:
        print(f"SUCCESS: Backend blocked duplicate. Error: {serializer2.errors}")

    # 3. Attempt to create DIFFERENT category for same period
    print("3. Attempting to create MAINTENANCE transaction for same Jan 2029 period...")
    maint_data = base_data.copy()
    maint_data['category'] = FinancialTransaction.Category.MAINTENANCE
    maint_data['type'] = FinancialTransaction.TransactionType.OUTFLOW
    
    serializer3 = FinancialTransactionSerializer(data=maint_data, context={'request': type('obj', (object,), {'user': user})})
    if serializer3.is_valid():
        tx3 = serializer3.save()
        print(f"SUCCESS: Maintenance allowed for same period (ID {tx3.id})")
    else:
        print(f"FAILURE: Expected maintenance to be allowed, got {serializer3.errors}")

    # Cleanup
    tx1.delete()
    tx3.delete()
    print("-" * 50)
    print("Test Complete.")

if __name__ == "__main__":
    test_uniqueness()
