from rest_framework import serializers
from .models import FinancialTransaction, Wallet, CashCall, Settlement

class WalletSerializer(serializers.ModelSerializer):
    """
    ReadOnly Serializer for Wallet Balance.
    """
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'property', 'property_name', 'balance', 'last_updated']
        read_only_fields = ['balance', 'last_updated']

class CashCallSerializer(serializers.ModelSerializer):
    """
    Serializer for Cash Calls (Appels de Fonds).
    """
    property_name = serializers.CharField(source='property.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CashCall
        fields = [
            'id', 'property', 'property_name',
            'amount', 'reason', 'description', 'due_date',
            'status', 'status_display',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class SettlementSerializer(serializers.ModelSerializer):
    """
    Serializer for Settlements (Reversements).
    """
    property_name = serializers.CharField(source='property.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Settlement
        fields = [
            'id', 'property', 'property_name',
            'amount', 'period_start', 'period_end',
            'status', 'status_display', 'reference', 'note',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class FinancialTransactionSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = FinancialTransaction
        fields = [
            'id', 'property', 'property_name', 'project', 'type', 'type_display',
            'category', 'category_display', 'amount', 'date',
            'period_month', 'period_year', 'parent_transaction', 'site',
            'description', 'invoice', 'created_by', 'created_by_name',
            'created_at', 'updated_at',
            'cash_call', 'settlement' 
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'parent_transaction']

    def validate(self, data):
        """
        Prevent duplicate RENT transactions for the same property and performance period.
        """
        category = data.get('category')
        prop = data.get('property')
        month = data.get('period_month')
        year = data.get('period_year')

        if category == FinancialTransaction.Category.RENT and prop:
            # 1. Duplication Check
            if month and year:
                existing = FinancialTransaction.objects.filter(
                    property=prop,
                    category=FinancialTransaction.Category.RENT,
                    period_month=month,
                    period_year=year
                )
                if self.instance:
                    existing = existing.exclude(id=self.instance.id)

                if existing.exists():
                    raise serializers.ValidationError({
                        "period_month": f"Une transaction de loyer existe déjà pour {month}/{year}. Veuillez modifier la transaction existante ou choisir une autre période."
                    })

            # 2. Ceiling Check (Rent amount vs. Target rent)
            target_rent = prop.loyer_mensuel
            amount = data.get('amount')
            if target_rent and amount and amount > target_rent:
                raise serializers.ValidationError({
                    "amount": f"Le montant ({amount}€) dépasse le loyer mensuel attendu ({target_rent}€) pour ce bien. Veuillez vérifier votre saisie ou modifier l'objectif sur la fiche du bien."
                })

        return data

    def _sync_child_transactions(self, instance):
        """
        Internal helper to create or update associated commission and monthly charges.
        """
        if instance.category != FinancialTransaction.Category.RENT:
            return

        from properties.models import Property
        prop = instance.property
        
        # 1. Commission Calculation
        comm_amount = 0
        if prop.commission_type == Property.CommissionType.POURCENTAGE and prop.commission_rate:
            comm_amount = (instance.amount * prop.commission_rate) / 100
        elif prop.commission_type == Property.CommissionType.FIXE and prop.commission_fixe:
            comm_amount = prop.commission_fixe

        if comm_amount > 0:
            FinancialTransaction.objects.update_or_create(
                parent_transaction=instance,
                category=FinancialTransaction.Category.COMMISSION,
                defaults={
                    'property': prop,
                    'type': FinancialTransaction.TransactionType.OUTFLOW,
                    'amount': comm_amount,
                    'date': instance.date,
                    'period_month': instance.period_month,
                    'period_year': instance.period_year,
                    'description': f"Commission MaDis auto-générée pour {prop.name}",
                    'created_by': instance.created_by
                }
            )

        # 2. Monthly Charges Calculation (Only once per month)
        if prop.charges_mensuelles and prop.charges_mensuelles > 0:
            # Check if charges already exist for this month/property (excluding children of this rent)
            existing_charges = FinancialTransaction.objects.filter(
                property=prop,
                category=FinancialTransaction.Category.CHARGES,
                period_month=instance.period_month,
                period_year=instance.period_year
            ).exclude(parent_transaction=instance)

            if not existing_charges.exists():
                FinancialTransaction.objects.update_or_create(
                    parent_transaction=instance,
                    category=FinancialTransaction.Category.CHARGES,
                    defaults={
                        'property': prop,
                        'type': FinancialTransaction.TransactionType.OUTFLOW,
                        'amount': prop.charges_mensuelles,
                        'date': instance.date,
                        'period_month': instance.period_month,
                        'period_year': instance.period_year,
                        'description': f"Charges mensuelles auto-générées pour {prop.name}",
                        'created_by': instance.created_by
                    }
                )

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        instance = super().create(validated_data)
        self._sync_child_transactions(instance)
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        self._sync_child_transactions(instance)
        return instance


class FinancialSummarySerializer(serializers.Serializer):
    """Aggregate financial data for dashboards."""
    total_inflow = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_outflow = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    commission_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    monthly_data = serializers.ListField(
        child=serializers.DictField()
    )
