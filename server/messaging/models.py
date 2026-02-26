from django.db import models
from django.conf import settings


class Ticket(models.Model):
    """Support ticket created by a client or internally."""

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Ouvert'
        IN_PROGRESS = 'IN_PROGRESS', 'En cours'
        CLOSED = 'CLOSED', 'Fermé'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Basse'
        MEDIUM = 'MEDIUM', 'Moyenne'
        HIGH = 'HIGH', 'Haute'
        URGENT = 'URGENT', 'Urgente'

    subject = models.CharField('sujet', max_length=255)
    description = models.TextField('description', blank=True)
    attachment = models.FileField(
        'pièce jointe', upload_to='tickets/%Y/%m/', null=True, blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name='créé par',
    )
    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name='bien concerné',
    )
    status = models.CharField(
        'statut', max_length=20, choices=Status.choices, default=Status.OPEN
    )
    priority = models.CharField(
        'priorité', max_length=20, choices=Priority.choices, default=Priority.MEDIUM
    )
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('dernière modification', auto_now=True)

    class Meta:
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_status_display()}] {self.subject}"


class Message(models.Model):
    """Message in a ticket thread."""

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='ticket',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ticket_messages',
        verbose_name='auteur',
    )
    content = models.TextField('contenu')
    attachment = models.FileField(
        'pièce jointe', upload_to='messages/%Y/%m/', null=True, blank=True
    )
    is_internal = models.BooleanField('note interne', default=False)
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Message de {self.author} — {self.created_at:%d/%m/%Y %H:%M}"


class Notification(models.Model):
    """Internal notification for a user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='utilisateur',
    )
    title = models.CharField('titre', max_length=255)
    message = models.TextField('message')
    link = models.CharField('lien', max_length=255, blank=True)
    is_read = models.BooleanField('lu', default=False)
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification pour {self.user}: {self.title}"
