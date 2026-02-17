from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Transaction, Property

@receiver(post_save, sender=Transaction)
def update_property_status_on_sale(sender, instance, **kwargs):
    """
    Synchronizes property status with transaction state.
    - If SIGNE: Sets property to VENDU/LOUE and cancels others.
    - If NOT SIGNE: Reverts property to DISPONIBLE if no other signed TX remains.
    """
    prop = instance.property

    if instance.status == 'SIGNE':
        # 1. Update Property Ownership and Status
        original_owner = prop.owner
        new_status = 'VENDU' if prop.transaction_nature == 'VENTE' else 'LOUE'
        
        # Transfer ownership if a buyer is present
        if instance.buyer_tenant:
            import datetime
            prop.owner = instance.buyer_tenant
            prop.prix_acquisition = instance.final_price
            prop.date_acquisition = datetime.date.today()
            prop.frais_acquisition_annexes = 0  # Reset for the new owner
            prop.pending_decision = True        # Trigger the decision flow for the new owner
            prop.is_verified_fonciere = False    # New owner might need new verification
            print(f"DEBUG: Ownership of property {prop.id} transferred to {instance.buyer_tenant.id} on {prop.date_acquisition}")

        if prop.status != new_status:
            prop.status = new_status

        prop.save()
        print(f"DEBUG: Property {prop.id} status updated to {new_status} and saved.")

        # 1.1 Create Financial Transactions for the SELLER
        if original_owner and prop.transaction_nature == 'VENTE':
            from finance.models import FinancialTransaction
            import datetime
            
            # Sale Revenue
            sale_tx = FinancialTransaction.objects.create(
                property=prop,
                owner=original_owner,
                type=FinancialTransaction.TransactionType.INFLOW,
                category=FinancialTransaction.Category.PROMOTION_SALE,
                amount=instance.final_price,
                date=datetime.date.today(),
                description=f"Vente du bien {prop.name} à {instance.buyer_tenant.get_full_name() if instance.buyer_tenant else 'un tiers'}"
            )
            print(f"DEBUG: Recorded Sale INFLOW for seller {original_owner.id}")

            # Calculate MaDis Commission
            commission_amount = 0
            if prop.commission_type == 'POURCENTAGE' and prop.commission_rate:
                commission_amount = (instance.final_price * prop.commission_rate) / 100
            elif prop.commission_type == 'FIXE' and prop.commission_fixe:
                commission_amount = prop.commission_fixe
            
            if commission_amount > 0:
                FinancialTransaction.objects.create(
                    property=prop,
                    owner=original_owner,
                    parent_transaction=sale_tx,
                    type=FinancialTransaction.TransactionType.OUTFLOW,
                    category=FinancialTransaction.Category.COMMISSION,
                    amount=commission_amount,
                    date=datetime.date.today(),
                    description=f"Commission MaDis pour la vente de {prop.name}"
                )
                print(f"DEBUG: Recorded Commission OUTFLOW for seller {original_owner.id}: {commission_amount}€")

        # 1.2 Create Financial Transactions for the BUYER
        if instance.buyer_tenant and instance.status == 'SIGNE' and prop.transaction_nature == 'VENTE':
            from finance.models import FinancialTransaction
            import datetime
            FinancialTransaction.objects.create(
                property=prop,
                owner=instance.buyer_tenant,
                type=FinancialTransaction.TransactionType.OUTFLOW,
                category=FinancialTransaction.Category.PROMOTION_SALE,
                amount=instance.final_price,
                date=datetime.date.today(),
                description=f"Acquisition du bien {prop.name}"
            )
            print(f"DEBUG: Recorded Acquisition OUTFLOW for buyer {instance.buyer_tenant.id}: -{instance.final_price}€")

        # 2. Cancel other 'DISPONIBLE' or 'NEGOCIATION' transactions for this property
        other_txs = Transaction.objects.filter(
            property=prop,
            status__in=['DISPONIBLE', 'NEGOCIATION']
        ).exclude(id=instance.id)
        
        count = other_txs.count()
        if count > 0:
            other_txs.update(status='ANNULE')
            print(f"DEBUG: Cancelled {count} other transactions for property {prop.id}.")

        # 3. Notify Buyer
        if instance.buyer_tenant:
            from messaging.models import Notification
            Notification.objects.create(
                user=instance.buyer_tenant,
                title="Félicitations ! Transaction Confirmée",
                message=f"Le contrat pour le bien '{prop.name}' a été signé. Vous pouvez maintenant consulter les détails dans votre espace.",
                link=f"/dashboard/properties/{prop.id}/"
            )
            print(f"DEBUG: Notification sent to buyer {instance.buyer_tenant.id} for property {prop.id}.")
    
    else:
        # If this transaction is NOT 'SIGNE', check if any other transaction for this property IS signed
        has_signed_tx = Transaction.objects.filter(property=prop, status='SIGNE').exists()
        
        if not has_signed_tx:
            # If no transactions are signed anymore, the property should return to 'DISPONIBLE'
            # (to reappear on marketplace)
            if prop.status in ['VENDU', 'LOUE']:
                prop.status = 'DISPONIBLE'
                prop.save()
                print(f"DEBUG: Property {prop.id} reverted to DISPONIBLE (Marketplace restated).")
