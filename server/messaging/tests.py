from django.test import TestCase
from django.urls import reverse
from django.core import mail
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from accounts.models import User
from properties.models import Property
from .models import Ticket, Message, Notification


class TicketModelTest(TestCase):
    """Tests for the Ticket model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='client@test.fr', username='client', password='pass123',
            role=User.Role.CLIENT,
        )

    def test_ticket_creation(self):
        """Ticket is created with default status OPEN."""
        ticket = Ticket.objects.create(
            subject='Probleme avec mon bien',
            created_by=self.user,
            priority=Ticket.Priority.HIGH,
        )
        self.assertEqual(ticket.status, Ticket.Status.OPEN)
        self.assertEqual(ticket.priority, 'HIGH')
        self.assertEqual(ticket.created_by, self.user)

    def test_message_thread(self):
        """Messages are linked to a ticket thread."""
        ticket = Ticket.objects.create(
            subject='Question', created_by=self.user,
        )
        msg1 = Message.objects.create(
            ticket=ticket, author=self.user, content='Bonjour, question...',
        )
        msg2 = Message.objects.create(
            ticket=ticket, author=self.user, content='Merci de repondre',
        )
        self.assertEqual(ticket.messages.count(), 2)
        self.assertEqual(ticket.messages.first(), msg1)


class TicketAPITest(TestCase):
    """Tests for Ticket API endpoints."""

    def setUp(self):
        from django.conf import settings
        self.api_client = APIClient()
        self.admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@madis.fr')
        self.admin = User.objects.create_user(
            email=self.admin_email, username='admin', password='adminpass123',
            role=User.Role.ADMIN_MADIS, first_name='Admin', last_name='MaDis'
        )
        self.client_user = User.objects.create_user(
            email='client@test.fr', username='client', password='clientpass123',
            role=User.Role.CLIENT, first_name='Jean', last_name='Client'
        )
        self.other_client = User.objects.create_user(
            email='other@test.fr', username='other', password='otherpass123',
            role=User.Role.CLIENT,
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client_token = Token.objects.create(user=self.client_user)
        self.other_token = Token.objects.create(user=self.other_client)

        self.ticket1 = Ticket.objects.create(
            subject='Ticket Jean', created_by=self.client_user,
        )
        self.ticket2 = Ticket.objects.create(
            subject='Ticket Other', created_by=self.other_client,
        )

    def test_client_sees_only_own_tickets(self):
        """Client sees only their own tickets."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get('/api/v1/tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['subject'], 'Ticket Jean')

    def test_admin_sees_all_tickets(self):
        """Admin MaDis sees all tickets."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.get('/api/v1/tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_client_can_create_ticket(self):
        """Client can create a new ticket."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.post('/api/v1/tickets/', {
            'subject': 'Nouveau ticket',
            'priority': 'MEDIUM',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket = Ticket.objects.get(subject='Nouveau ticket')
        self.assertEqual(ticket.created_by, self.client_user)

    def test_ticket_detail_includes_messages(self):
        """Ticket detail returns the full message thread."""
        Message.objects.create(
            ticket=self.ticket1, author=self.client_user, content='Premier message',
        )
        Message.objects.create(
            ticket=self.ticket1, author=self.admin, content='Reponse admin',
        )
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get(f'/api/v1/tickets/{self.ticket1.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['messages']), 2)

    def test_client_cannot_delete_ticket(self):
        """Client cannot delete a ticket."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.delete(f'/api/v1/tickets/{self.ticket1.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_delete_ticket(self):
        """Admin can delete a ticket."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.delete(f'/api/v1/tickets/{self.ticket1.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_can_update_ticket_status(self):
        """Admin can change ticket status."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.patch(f'/api/v1/tickets/{self.ticket1.pk}/', {
            'status': 'IN_PROGRESS',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket1.refresh_from_db()
        self.assertEqual(self.ticket1.status, 'IN_PROGRESS')


class MessageAPITest(TestCase):
    """Tests for the nested messages endpoint."""

    def setUp(self):
        from django.conf import settings
        self.api_client = APIClient()
        self.admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@madis.fr')
        self.admin = User.objects.create_user(
            email=self.admin_email, username='admin', password='adminpass123',
            role=User.Role.ADMIN_MADIS, first_name='Admin', last_name='MaDis'
        )
        self.client_user = User.objects.create_user(
            email='client@test.fr', username='client', password='clientpass123',
            role=User.Role.CLIENT, first_name='Jean', last_name='Client'
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client_token = Token.objects.create(user=self.client_user)
        self.ticket = Ticket.objects.create(
            subject='Test ticket', created_by=self.client_user,
        )

    def test_post_message_to_ticket(self):
        """Client can post a message to their ticket."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.post(
            f'/api/v1/tickets/{self.ticket.pk}/messages/',
            {'content': 'Mon message'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        msg = Message.objects.get(ticket=self.ticket)
        self.assertEqual(msg.content, 'Mon message')
        self.assertEqual(msg.author, self.client_user)

    def test_list_messages_for_ticket(self):
        """List messages returns messages for a specific ticket."""
        Message.objects.create(
            ticket=self.ticket, author=self.client_user, content='Msg 1',
        )
        Message.objects.create(
            ticket=self.ticket, author=self.client_user, content='Msg 2',
        )
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get(
            f'/api/v1/tickets/{self.ticket.pk}/messages/',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response is paginated
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)

    def test_internal_not_visible_to_client(self):
        """Internal notes are hidden from non-admin users."""
        Message.objects.create(
            ticket=self.ticket, author=self.admin, content='Note discrete',
            is_internal=True
        )
        Message.objects.create(
            ticket=self.ticket, author=self.client_user, content='Message public'
        )
        
        # Test nested messages list
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get(f'/api/v1/tickets/{self.ticket.pk}/messages/')
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['content'], 'Message public')
        
        # Test ticket detail thread
        response = self.api_client.get(f'/api/v1/tickets/{self.ticket.pk}/')
        self.assertEqual(len(response.data['messages']), 1)
        self.assertEqual(response.data['messages'][0]['content'], 'Message public')

    def test_email_sent_on_ticket_creation(self):
        """Admin should receive an email when a ticket is created."""
        mail.outbox = []
        data = {
            'subject': 'Ticket Urgent Email',
            'description': 'Description email',
            'priority': 'URGENT'
        }
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.post('/api/v1/tickets/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Ticket Urgent Email', mail.outbox[0].subject)

    def test_email_sent_on_staff_reply(self):
        """Client should receive an email when staff replies."""
        mail.outbox = []
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        data = {'content': 'Reponse support'}
        response = self.api_client.post(f'/api/v1/tickets/{self.ticket.pk}/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.client_user.email])

    def test_no_email_on_internal_note(self):
        """Client should NOT receive an email for internal notes."""
        mail.outbox = []
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        data = {'content': 'Note secrete', 'is_internal': True}
        response = self.api_client.post(f'/api/v1/tickets/{self.ticket.pk}/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 0)

class NotificationAPITest(TestCase):
    """Tests for the internal notification system."""

    def setUp(self):
        from django.conf import settings
        self.api_client = APIClient()
        self.admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@madis.fr')
        self.admin = User.objects.create_user(
            email=self.admin_email, username='admin', password='adminpass123',
            role=User.Role.ADMIN_MADIS, first_name='Admin', last_name='MaDis'
        )
        self.client_user = User.objects.create_user(
            email='client@test.fr', username='client', password='clientpass123',
            role=User.Role.CLIENT, first_name='Jean', last_name='Client'
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client_token = Token.objects.create(user=self.client_user)
        self.ticket = Ticket.objects.create(
            subject='Initial Ticket', created_by=self.client_user,
        )

    def test_notification_on_ticket_creation(self):
        """Admin should receive a notification when a ticket is created."""
        Notification.objects.all().delete()
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        self.api_client.post('/api/v1/tickets/', {'subject': 'Urgent help', 'priority': 'HIGH'})
        
        # Check admin notifications
        self.assertEqual(Notification.objects.filter(user=self.admin).count(), 1)
        notif = Notification.objects.filter(user=self.admin).first()
        self.assertIn('Jean Client a créé un ticket', notif.message)

    def test_notification_on_staff_reply(self):
        """Client should receive a notification when staff replies."""
        Notification.objects.all().delete()
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        self.api_client.post(f'/api/v1/tickets/{self.ticket.pk}/messages/', {'content': 'Hello client'})
        
        # Check client notifications
        self.assertEqual(Notification.objects.filter(user=self.client_user).count(), 1)
        notif = Notification.objects.filter(user=self.client_user).first()
        self.assertIn('équipe MaDis a répondu', notif.message)

    def test_notification_on_client_reply(self):
        """Admin should receive a notification when client replies."""
        Notification.objects.all().delete()
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        self.api_client.post(f'/api/v1/tickets/{self.ticket.pk}/messages/', {'content': 'My reply'})
        
        # Check admin notifications
        self.assertEqual(Notification.objects.filter(user=self.admin).count(), 1)
        notif = Notification.objects.filter(user=self.admin).first()
        self.assertIn('Jean Client a répondu au ticket', notif.message)

    def test_unread_count_endpoint(self):
        """unread_count endpoint returns correct number of unread notifications."""
        Notification.objects.create(user=self.client_user, title="N1", message="M1", is_read=False)
        Notification.objects.create(user=self.client_user, title="N2", message="M2", is_read=False)
        Notification.objects.create(user=self.client_user, title="N3", message="M3", is_read=True)
        
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get('/api/v1/notifications/unread_count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 2)
