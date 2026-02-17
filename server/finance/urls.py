from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FinancialTransactionViewSet, 
    WalletViewSet, 
    CashCallViewSet, 
    SettlementViewSet
)

router = DefaultRouter()
router.register('transactions', FinancialTransactionViewSet, basename='financial-transaction')
router.register('wallets', WalletViewSet, basename='wallet')
router.register('cash-calls', CashCallViewSet, basename='cash-call')
router.register('settlements', SettlementViewSet, basename='settlement')

urlpatterns = [
    path('', include(router.urls)),
]
