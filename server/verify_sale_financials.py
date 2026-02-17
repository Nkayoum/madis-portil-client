import os
import django
import datetime
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from properties.models import Property, Transaction
from finance.models import FinancialTransaction
from django.contrib.auth import get_user_model

User = get_user_model()

def verify_sale_financials():
    print("--- START VERIFICATION ---")
    
    # 1. Setup Test Data
    seller = User.objects.filter(role='CLIENT').first()
    buyer = User.objects.filter(role='CLIENT').exclude(id=seller.id).first()
    
    if not seller or not buyer:
        print("ERROR: Need at least two client users for test.")
        return

    prop = Property.objects.create(
        name="Test Verification Prop",
        city="Test City",
        owner=seller,
        status='DISPONIBLE',
        prix_vente=Decimal('1000000.00'),
        transaction_nature='VENTE',
        commission_type='POURCENTAGE',
        commission_rate=Decimal('10.00'), # 100k commission
        prix_acquisition=Decimal('800000.00')
    )
    print(f"Created property {prop.name} for seller {seller.email}")

    # 2. Simulate SIGNED Transaction
    tx = Transaction.objects.create(
        property=prop,
        buyer_tenant=buyer,
        asking_price=Decimal('1000000.00'),
        final_price=Decimal('1000000.00'),
        status='SIGNE'
    )
    print(f"Signed transaction for {tx.final_price}€")

    # 3. Verify Signal Results
    prop.refresh_from_db()
    print(f"New Owner: {prop.owner.email} (Should be {buyer.email})")
    print(f"New Status: {prop.status} (Should be VENDU)")
    print(f"New Acq Price: {prop.prix_acquisition}")

    # 4. Verify Financial Transactions
    seller_txs = FinancialTransaction.objects.filter(owner=seller, property=prop)
    print(f"Seller Transactions count: {seller_txs.count()} (Should be 2)")
    
    for t in seller_txs:
        print(f"  - {t.category}: {t.amount}€ ({t.type})")

    sale_tx = seller_txs.filter(category='PROMOTION_SALE').first()
    comm_tx = seller_txs.filter(category='COMMISSION').first()

    if sale_tx and sale_tx.amount == Decimal('1000000.00'):
        print("SUCCESS: Sale record found for seller.")
    else:
        print("FAILED: Sale record missing or incorrect.")

    if comm_tx and comm_tx.amount == Decimal('1000000.00') * Decimal('0.10'):
        print("SUCCESS: Commission record found for seller.")
    else:
        print("FAILED: Commission record missing or incorrect.")

    # 4.1 Verify Buyer Transactions
    buyer_txs = FinancialTransaction.objects.filter(owner=buyer, property=prop)
    print(f"Buyer Transactions count: {buyer_txs.count()} (Should be 1)")
    
    acq_tx = buyer_txs.filter(category='PROMOTION_SALE', type='OUTFLOW').first()
    if acq_tx and acq_tx.amount == Decimal('1000000.00'):
        print("SUCCESS: Acquisition record found for buyer.")
    else:
        print("FAILED: Acquisition record missing or incorrect for buyer.")

    # 5. Cleanup
    prop.delete()
    print("--- END VERIFICATION ---")

if __name__ == "__main__":
    verify_sale_financials()
