from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'properties'

router = DefaultRouter()
router.register(r'properties', views.PropertyViewSet, basename='property')
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'marketplace', views.PublicPropertyViewSet, basename='marketplace')

urlpatterns = [
    path('marketplace/offer/', views.create_offer, name='marketplace-offer'),
    path('', include(router.urls)),
]
