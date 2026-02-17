from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'messaging'

router = DefaultRouter()
router.register(r'tickets', views.TicketViewSet, basename='ticket')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'tickets/<int:ticket_pk>/messages/',
        views.MessageViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='ticket-messages',
    ),
]
