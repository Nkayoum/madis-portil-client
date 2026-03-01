from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField('action effectuée', max_length=255)
    ip_address = models.GenericIPAddressField('adresse IP', null=True, blank=True)
    details = models.TextField('détails', blank=True, null=True)
    created_at = models.DateTimeField('date et heure', auto_now_add=True)

    class Meta:
        verbose_name = "Journal d'Audit"
        verbose_name_plural = "Journaux d'Audit"
        ordering = ['-created_at']

    def __str__(self):
        user_email = self.user.email if self.user else "Système"
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {user_email} - {self.action}"
