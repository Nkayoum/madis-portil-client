from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import viewsets, mixins, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminMaDis
from .models import Ticket, Message, Notification
from .serializers import (
    TicketSerializer, TicketDetailSerializer,
    MessageSerializer, NotificationSerializer
)
from .utils import send_ticket_notification

User = get_user_model()


class TicketViewSet(viewsets.ModelViewSet):
    """
    CRUD for tickets.
    - Clients see only their own tickets.
    - Admins MaDis see all tickets and can update status.
    """

    filterset_fields = ['status', 'priority', 'property', 'created_by']
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

    def perform_create(self, serializer):
        ticket = serializer.save()

        # Notify Admin
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@madis.fr')
        admin_user = User.objects.filter(email=admin_email).first()
        if admin_user:
            # Email Notification
            send_ticket_notification(
                user=admin_user,
                ticket=ticket,
                template_prefix='ticket_created'
            )
            
            # Internal UI Notification
            Notification.objects.create(
                user=admin_user,
                title="Nouveau ticket",
                message=f"Le client {ticket.created_by.get_full_name()} a créé un ticket : {ticket.subject}",
                link=f"/dashboard/tickets/{ticket.id}"
            )


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
        user = self.request.user
        queryset = Message.objects.filter(ticket_id=self.kwargs['ticket_pk'])
        if user.role != 'ADMIN_MADIS':
            queryset = queryset.filter(is_internal=False)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        message = serializer.save(
            author=user,
            ticket_id=self.kwargs['ticket_pk'],
        )
        
        # 1. Notify Client if a STAFF member replies and NOT an internal note
        if user.role in ['ADMIN_MADIS', 'CHEF_CHANTIER'] and not message.is_internal:
            client = message.ticket.created_by
            if client and client != user:
                # Email
                send_ticket_notification(
                    user=client,
                    ticket=message.ticket,
                    template_prefix='message_received',
                    message=message
                )
                # Internal UI Notification
                Notification.objects.create(
                    user=client,
                    title="Nouveau message",
                    message=f"L'équipe MaDis a répondu à votre ticket : {message.ticket.subject}",
                    link=f"/dashboard/tickets/{message.ticket.id}"
                )
        
        # 2. Notify Admin if a CLIENT replies
        elif user.role == 'CLIENT':
            admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@madis.fr')
            admin_user = User.objects.filter(email=admin_email).first()
            if admin_user:
                Notification.objects.create(
                    user=admin_user,
                    title="Message client",
                    message=f"Le client {user.get_full_name()} a répondu au ticket : {message.ticket.subject}",
                    link=f"/dashboard/tickets/{message.ticket.id}"
                )

        # 3. Broadcast message via WebSockets
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'ticket_{message.ticket.id}',
            {
                'type': 'chat_message',
                'message': self.get_serializer(message).data
            }
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

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'])
    def mark_as_read_by_link(self, request):
        link = request.data.get('link')
        if not link:
            return Response({'error': 'Link parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        updated_count = self.get_queryset().filter(link=link, is_read=False).update(is_read=True)
        return Response({'updated_count': updated_count})
