from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminMaDis
from .models import Ticket, Message, Notification
from .serializers import (
    TicketSerializer, TicketDetailSerializer, 
    MessageSerializer, NotificationSerializer
)


class TicketViewSet(viewsets.ModelViewSet):
    """
    CRUD for tickets.
    - Clients see only their own tickets.
    - Admins MaDis see all tickets and can update status.
    """

    filterset_fields = ['status', 'priority', 'property']
    search_fields = ['subject']
    ordering_fields = ['created_at', 'priority', 'status']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Ticket.objects.none()
        if user.role == 'ADMIN_MADIS':
            return Ticket.objects.all()
        return Ticket.objects.filter(created_by=user)

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdminMaDis()]
        return [IsAuthenticated()]


class MessageViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    List and create messages for a specific ticket.
    GET/POST /api/v1/tickets/<ticket_id>/messages/
    """

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(ticket_id=self.kwargs['ticket_pk'])

    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            ticket_id=self.kwargs['ticket_pk'],
        )


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    List and mark notifications as read.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
