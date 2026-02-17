from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction, models
from .models import FinancialTransaction, Wallet, CashCall, Settlement

def update_wallet_balance(property_id):
    """
    Recalculates the wallet balance from scratch to ensure accuracy.
    Balance = Sum(CashCalls PAID) - Sum(Settlements PAID) + Sum(Inflows) - Sum(Outflows)
    
    Note: Inflows/Outflows here refer to Rent/Expenses which are NOT CashCalls or Settlements.
    Since we linked CashCalls/Settlements to FinancialTransactions in models, we need to be careful not to double count.
    
    Strategy:
    1. Base Balance = 0
    2. Add all FinancialTransactions where type=INFLOW
    3. Subtract all FinancialTransactions where type=OUTFLOW
    
    Wait! If a CashCall is PAID, does it create a FinancialTransaction?
    Yes, usually we should create a FinancialTransaction for every movement to keep the ledger clean.
    
    Let's assume the flow is:
    1. CashCall created (DRAFT) -> No impact.
    2. CashCall marked PAID -> Creates a FinancialTransaction (INFLOW, Cat=CASH_CALL).
    3. Settlement marked PAID -> Creates a FinancialTransaction (OUTFLOW, Cat=SETTLEMENT).
    
    So, simply summing up FinancialTransactions is enough?
    Yes, IF we ensure that CashCall/Settlement status changes trigger Transaction creation.
    
    However, for the MVP, let's Stick to the Plan:
    "FinancialTransaction remains the source of truth".
    
    So the Wallet balance is simply the sum of all FinancialTransactions for that property.
    """
    
    # Only update if wallet exists. If it doesn't, it might have been deleted or not created yet.
    # We don't want to recreate a wallet during a property/transaction deletion cascade.
    wallet = Wallet.objects.filter(property_id=property_id).first()
    if not wallet:
        return
    
    # Calculate sum
    inflows = FinancialTransaction.objects.filter(
        property_id=property_id, 
        type=FinancialTransaction.TransactionType.INFLOW
    ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    outflows = FinancialTransaction.objects.filter(
        property_id=property_id, 
        type=FinancialTransaction.TransactionType.OUTFLOW
    ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    wallet.balance = inflows - outflows
    wallet.save()

@receiver(post_save, sender=FinancialTransaction)
@receiver(post_delete, sender=FinancialTransaction)
def on_transaction_change(sender, instance, **kwargs):
    update_wallet_balance(instance.property_id)

# Automating Transaction Creation from CashCall/Settlement
# When a CashCall becomes PAID, we should create a FinancialTransaction.
# When a Settlement becomes PAID, we should create a FinancialTransaction.

@receiver(post_save, sender=CashCall)
def on_cash_call_save(sender, instance, created, **kwargs):
    if instance.status == CashCall.Status.PAID:
        # Check if transaction already exists
        if not instance.transactions.exists():
            FinancialTransaction.objects.create(
                property=instance.property,
                cash_call=instance,
                type=FinancialTransaction.TransactionType.INFLOW,
                category=FinancialTransaction.Category.CASH_CALL,
                amount=instance.amount,
                date=instance.updated_at.date(), # Or use a specific payment date field if added
                description=f"Paiement Appel de Fonds: {instance.reason}",
                created_by=instance.created_by
            )
    else:
        # If status changed back from PAID (e.g. error), delete the transaction?
        # For safety, let's keep it simple for now. Manual correction might be better.
        pass

@receiver(post_save, sender=Settlement)
def on_settlement_save(sender, instance, created, **kwargs):
    if instance.status == Settlement.Status.PAID:
        if not instance.transactions.exists():
            FinancialTransaction.objects.create(
                property=instance.property,
                settlement=instance,
                type=FinancialTransaction.TransactionType.OUTFLOW,
                category=FinancialTransaction.Category.SETTLEMENT,
                amount=instance.amount,
                date=instance.updated_at.date(),
                description=f"Reversement versé: {instance.reference}",
                created_by=instance.created_by
            )
