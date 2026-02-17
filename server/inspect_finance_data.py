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

def inspect_data():
    print("Inspecting Financial Data for Discrepancies...")
    print("-" * 50)
    
    # Identify the property (likely the one with 15000 rent)
    # Based on screenshot: Loyer 5000€/mois
    props = Property.objects.filter(loyer_mensuel=5000)
    if not props.exists():
        print("No property with 5000€ rent found.")
        return

    for prop in props:
        print(f"\nProperty: {prop.name} (ID: {prop.id})")
        print(f"Target Monthly Rent: {prop.loyer_mensuel}")
        print(f"Acquisition Date: {prop.date_acquisition}")
        
        txs = FinancialTransaction.objects.filter(property=prop).order_by('-date')
        print(f"Total Transactions: {txs.count()}")
        
        total_rent = 0
        total_inflow = 0
        for tx in txs:
            print(f" - {tx.date} | {tx.type} | Category: {tx.category} | Amount: {tx.amount} | ID: {tx.id} | Period: {tx.period_month}/{tx.period_year}")
            if tx.type == FinancialTransaction.TransactionType.INFLOW:
                total_inflow += tx.amount
                if tx.category == FinancialTransaction.Category.RENT:
                    total_rent += tx.amount
        
        print(f"\nAGGREGATED STATS FOR {prop.name}:")
        print(f" - Total Inflow: {total_inflow}€")
        print(f" - Total Rent Perçu: {total_rent}€")

if __name__ == "__main__":
    inspect_data()
