import os
import django
import sys
from django.db.models import Sum

# Setup Django
sys.path.append('c:/Users/bytes/OneDrive/Documents/DEV Bytes/test/server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from finance.models import FinancialTransaction

def audit_transactions():
    print("## SALES VOLUME")
    sales = FinancialTransaction.objects.filter(
        category=FinancialTransaction.Category.PROMOTION_SALE,
        type=FinancialTransaction.TransactionType.INFLOW
    )
    total_volume = sum(s.amount for s in sales)
    for s in sales:
        print(f"S|{s.id}|{s.date}|{s.property.name}|{s.amount}")
    
    print("## SALE COMMISSIONS")
    comms = FinancialTransaction.objects.filter(
        category=FinancialTransaction.Category.COMMISSION,
        parent_transaction__category=FinancialTransaction.Category.PROMOTION_SALE
    )
    total_comm = sum(c.amount for c in comms)
    for c in comms:
        print(f"C|{c.id}|{c.property.name}|{c.amount}|P:{c.parent_transaction_id}")

    print("## CAPITAL INVEST")
    invests = FinancialTransaction.objects.filter(
        category=FinancialTransaction.Category.PROMOTION_SALE,
        type=FinancialTransaction.TransactionType.OUTFLOW
    )
    for i in invests:
        print(f"I|{i.id}|{i.property.name}|{i.amount}")

    if total_volume > 0:
        avg_rate = (total_comm / total_volume) * 100
        print(f"ROI|{avg_rate:.2f}")

if __name__ == "__main__":
    audit_transactions()
