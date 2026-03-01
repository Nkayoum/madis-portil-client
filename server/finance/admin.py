from django.contrib import admin
from .models import Wallet, CashCall, Settlement, FinancialTransaction

class ReadOnlyDeleteMixin:
    """
    Mixin to strictly prevent the deletion of sensitive financial records.
    Overrides Django Admin `has_delete_permission`.
    """
    def has_delete_permission(self, request, obj=None):
        # We block all deletions to maintain audit continuity.
        return False

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('property', 'balance', 'last_updated')
    search_fields = ('property__name',)

@admin.register(CashCall)
class CashCallAdmin(ReadOnlyDeleteMixin, admin.ModelAdmin):
    list_display = ('property', 'amount', 'status', 'due_date', 'created_by')
    list_filter = ('status', 'property')
    search_fields = ('property__name', 'reason')

@admin.register(Settlement)
class SettlementAdmin(ReadOnlyDeleteMixin, admin.ModelAdmin):
    list_display = ('property', 'amount', 'status', 'period_start', 'period_end')
    list_filter = ('status', 'property')
    search_fields = ('property__name', 'reference')

@admin.register(FinancialTransaction)
class FinancialTransactionAdmin(ReadOnlyDeleteMixin, admin.ModelAdmin):
    list_display = ('date', 'property', 'type', 'category', 'amount', 'created_by')
    list_filter = ('type', 'category', 'date', 'property')
    search_fields = ('property__name', 'description')
    
