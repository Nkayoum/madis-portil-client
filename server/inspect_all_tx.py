import os
import django
import sys
from decimal import Decimal

# Setup Django
sys.path.append('c:\\Users\\bytes\\OneDrive\\Documents\\DEV Bytes\\test\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from finance.models import FinancialTransaction
from properties.models import Property

def inspect_all():
    print("Listing ALL Financial Transactions in DB...")
    print("-" * 50)
    
    txs = FinancialTransaction.objects.all().order_by('-date', '-created_at')
    print(f"Total Transactions in DB: {txs.count()}")
    
    for tx in txs:
        prop_name = tx.property.name if tx.property else "None"
        print(f"ID: {tx.id} | Date: {tx.date} | Prop: {prop_name} ({tx.property_id}) | {tx.type} | Cat: {tx.category} | Amount: {tx.amount} | Period: {tx.period_month}/{tx.period_year}")

    print("\nListing Properties...")
    for p in Property.objects.all():
        print(f"Prop ID: {p.id} | Name: {p.name} | Loyer: {p.loyer_mensuel} | Acq: {p.date_acquisition}")

if __name__ == "__main__":
    inspect_all()
